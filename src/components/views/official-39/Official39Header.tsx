import React from "react";
import { Edit2 } from "lucide-react";

interface Official39HeaderProps {
  schoolName: string;
  region: string;
  directorName: string;
  academicYear: string;
  approvalDate: string;
  stageTitle: string;
  onOpenRequisites: () => void;
}

export const Official39Header: React.FC<Official39HeaderProps> = ({
  schoolName,
  region,
  directorName,
  academicYear,
  approvalDate,
  stageTitle,
  onOpenRequisites,
}) => {
  return (
    <div className="w-full mb-4 font-serif">
      <div className="flex justify-between items-start text-xs sm:text-sm leading-relaxed mb-3">
        {/* Chap: TASDIQLAYMAN */}
        <div
          className="max-w-xs cursor-pointer group select-none"
          onClick={onOpenRequisites}
          title="Direktor rekvizitini tahrirlash uchun bosing"
        >
          <p className="font-bold tracking-widest text-sm sm:text-base uppercase flex items-center gap-1">
            TASDIQLAYMAN
            <Edit2 className="w-3 h-3 opacity-0 group-hover:opacity-100 text-blue-600 no-print transition-opacity" />
          </p>
          <p className="mt-1">
            Maktab direktori: <span className="inline-block border-b border-black w-24"></span>{" "}
            <span className="font-semibold underline decoration-dotted decoration-blue-500/50">{directorName}</span>
          </p>
          <p className="text-[11px] text-gray-700 mt-0.5">{approvalDate}</p>
        </div>

        {/* O'rta: Maktab nomi va Bosqich */}
        <div
          className="text-center flex-1 px-4 cursor-pointer group select-none"
          onClick={onOpenRequisites}
          title="Maktab nomini tahrirlash uchun bosing"
        >
          <p className="text-xs sm:text-sm font-semibold tracking-wide">
            {region} <span className="font-bold text-base">{schoolName}</span>ning
          </p>
          <p className="text-xs sm:text-sm font-semibold">
            {academicYear} o'quv yili uchun tuzilgan
          </p>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-[0.25em] uppercase mt-1">
            {stageTitle} &nbsp;&nbsp; D A R S &nbsp;&nbsp; J A D V A L I
          </h1>
        </div>

        {/* O'ng bo'sh joy */}
        <div className="w-32 hidden sm:block"></div>
      </div>
    </div>
  );
};

interface Official39SignaturesProps {
  vicePrincipalName: string;
  psychologistName: string;
  onOpenRequisites: () => void;
}

export const Official39Signatures: React.FC<Official39SignaturesProps> = ({
  vicePrincipalName,
  psychologistName,
  onOpenRequisites,
}) => {
  return (
    <div
      className="mt-6 flex justify-between items-center text-xs sm:text-sm font-serif pt-3 cursor-pointer group select-none"
      onClick={onOpenRequisites}
      title="Imzolarni tahrirlash uchun bosing"
    >
      <div className="flex items-center gap-2">
        <span className="font-bold">O'quv ishlari bo'yicha direktor o'rinbosari:</span>
        <span className="inline-block border-b border-black w-28"></span>
        <span className="font-semibold underline decoration-dotted decoration-blue-500/50">{vicePrincipalName}</span>
        <Edit2 className="w-3 h-3 opacity-0 group-hover:opacity-100 text-blue-600 no-print transition-opacity" />
      </div>

      <div className="flex items-center gap-2">
        <span className="font-bold">Maktab amaliyotchi psixologi:</span>
        <span className="inline-block border-b border-black w-28"></span>
        <span className="font-semibold underline decoration-dotted decoration-blue-500/50">{psychologistName}</span>
        <Edit2 className="w-3 h-3 opacity-0 group-hover:opacity-100 text-blue-600 no-print transition-opacity" />
      </div>
    </div>
  );
};
