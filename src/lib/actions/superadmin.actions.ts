"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export interface SuperAdminSchoolRecord {
  id: string;
  name: string;
  slug: string;
  region: string;
  directorFullName: string;
  plan: "trial" | "standard" | "pro";
  status: "active" | "suspended" | "trial";
  branchesCount: number;
  classesCount: number;
  teachersCount: number;
  createdAt: string;
  adminEmail?: string;
}

export interface SuperAdminStats {
  totalSchools: number;
  activeSubscriptions: number;
  totalTeachers: number;
  totalClasses: number;
  trialCount: number;
  standardCount: number;
  proCount: number;
}

/**
 * 1. Barcha maktablar va SaaS statistikasini yuklash
 */
export async function getSuperAdminDataAction() {
  try {
    const schools = await prisma.school.findMany({
      include: {
        branches: { select: { id: true } },
        classes: { select: { id: true } },
        teachers: { select: { id: true } },
        users: {
          where: { role: "SCHOOL_ADMIN" },
          select: { email: true },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formattedSchools: SuperAdminSchoolRecord[] = schools.map((s) => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
      region: s.region || "Ko'rsatilmagan",
      directorFullName: s.directorFullName || "Ko'rsatilmagan",
      plan: (s.subscriptionPlan as any) || "trial",
      status: (s.subscriptionStatus as any) || "active",
      branchesCount: s.branches.length,
      classesCount: s.classes.length,
      teachersCount: s.teachers.length,
      createdAt: s.createdAt.toISOString().slice(0, 10),
      adminEmail: s.users[0]?.email,
    }));

    const stats: SuperAdminStats = {
      totalSchools: formattedSchools.length,
      activeSubscriptions: formattedSchools.filter((s) => s.status === "active").length,
      totalTeachers: formattedSchools.reduce((acc, s) => acc + s.teachersCount, 0),
      totalClasses: formattedSchools.reduce((acc, s) => acc + s.classesCount, 0),
      trialCount: formattedSchools.filter((s) => s.plan === "trial").length,
      standardCount: formattedSchools.filter((s) => s.plan === "standard").length,
      proCount: formattedSchools.filter((s) => s.plan === "pro").length,
    };

    return {
      success: true,
      data: {
        schools: formattedSchools,
        stats,
      },
    };
  } catch (error: any) {
    console.error("getSuperAdminDataAction xatosi:", error);
    return { success: false, error: error?.message || "Super admin ma'lumotlarini yuklashda xatolik" };
  }
}

/**
 * 2. Yangi maktab va uning adminini yaratish
 */
export async function createSchoolAction(data: {
  name: string;
  slug: string;
  region?: string;
  directorFullName?: string;
  plan: "trial" | "standard" | "pro";
  adminFullName: string;
  adminEmail: string;
  adminPassword: string;
}) {
  try {
    const slug = data.slug.trim().toLowerCase().replace(/\s+/g, "-");
    const adminEmail = data.adminEmail.trim().toLowerCase();

    // Validatsiya
    const existingSchool = await prisma.school.findUnique({ where: { slug } });
    if (existingSchool) {
      return { success: false, error: "Bu slug/identifikator bilan maktab allaqachon mavjud!" };
    }

    const existingUser = await prisma.user.findUnique({ where: { email: adminEmail } });
    if (existingUser) {
      return { success: false, error: "Bu email bilan foydalanuvchi allaqachon mavjud!" };
    }

    const passwordHash = await bcrypt.hash(data.adminPassword || "admin123", 10);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Maktab
      const school = await tx.school.create({
        data: {
          name: data.name.trim(),
          slug,
          region: data.region?.trim() || "Toshkent shahri",
          directorFullName: data.directorFullName?.trim() || null,
          subscriptionPlan: data.plan,
          subscriptionStatus: "active",
        },
      });

      // 2. Boshlang'ich bino va smena
      await tx.branch.create({
        data: {
          schoolId: school.id,
          name: "Asosiy bino",
          isMain: true,
        },
      });

      await tx.shift.create({
        data: {
          schoolId: school.id,
          name: "1-smena (Ertalabki)",
          startTime: "08:00",
          endTime: "13:00",
          periodsCount: 6,
          order: 1,
        },
      });

      // 3. Maktab Admin foydalanuvchisi
      await tx.user.create({
        data: {
          schoolId: school.id,
          email: adminEmail,
          fullName: data.adminFullName.trim() || `${data.name} Administratori`,
          passwordHash,
          role: "SCHOOL_ADMIN",
          setupDone: true,
          isActive: true,
        },
      });

      return school;
    });

    return { success: true, schoolId: result.id };
  } catch (error: any) {
    console.error("createSchoolAction xatosi:", error);
    return { success: false, error: error?.message || "Maktab yaratishda xato" };
  }
}

/**
 * 3. Maktab obuna holati va tarifini yangilash
 */
export async function updateSchoolStatusAction(
  schoolId: string,
  status: "active" | "suspended" | "trial",
  plan?: "trial" | "standard" | "pro"
) {
  try {
    await prisma.school.update({
      where: { id: schoolId },
      data: {
        subscriptionStatus: status,
        ...(plan ? { subscriptionPlan: plan } : {}),
      },
    });

    return { success: true };
  } catch (error: any) {
    console.error("updateSchoolStatusAction xatosi:", error);
    return { success: false, error: error?.message };
  }
}

/**
 * 4. Maktabni o'chirish
 */
export async function deleteSchoolAction(schoolId: string) {
  try {
    await prisma.school.delete({
      where: { id: schoolId },
    });

    return { success: true };
  } catch (error: any) {
    console.error("deleteSchoolAction xatosi:", error);
    return { success: false, error: error?.message };
  }
}
