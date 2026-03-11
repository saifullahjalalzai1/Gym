import Barcode from "react-barcode";
import { QRCodeSVG } from "qrcode.react";

import CardStatusBadge from "./CardStatusBadge";
import type { CardDetail } from "../types/card";

interface CardPreviewProps {
  card: CardDetail;
  gymName: string;
  gymLogoUrl?: string | null;
  memberEmergencyPhone?: string | null;
  memberBloodGroup?: string | null;
  staffPosition?: string | null;
  staffFatherName?: string | null;
}

const formatDate = (value: string | null) => {
  if (!value) return "-";
  return new Date(value).toISOString().slice(0, 10);
};

export default function CardPreview({
  card,
  gymName,
  gymLogoUrl,
  memberEmergencyPhone,
  memberBloodGroup,
  staffPosition,
  staffFatherName,
}: CardPreviewProps) {
  return (
    <div className="w-[380px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
      <div className="h-2 w-full bg-gradient-to-r from-emerald-600 via-sky-600 to-indigo-600" />
      <div className="space-y-4 p-5">
        <header className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {gymLogoUrl ? (
              <img
                src={gymLogoUrl}
                alt="Gym logo"
                className="h-11 w-11 rounded-lg border border-slate-200 object-cover"
              />
            ) : null}
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Gym Card
              </p>
              <h2 className="text-base font-black text-slate-900">{gymName}</h2>
            </div>
          </div>
          <CardStatusBadge status={card.card_status} />
        </header>

        <section className="grid grid-cols-[1fr_auto] gap-4">
          <div className="space-y-1.5">
            <p className="text-lg font-bold leading-tight text-slate-900">{card.full_name}</p>
            <p className="text-sm font-medium text-slate-600">{card.profile_code}</p>
            <p className="text-xs text-slate-500">Card ID: {card.card_id}</p>
            <p className="text-xs text-slate-500">
              ID Card No: {card.id_card_number?.trim() || "-"}
            </p>
          </div>
          <img
            src={card.photo_url ?? "/images/user.jpeg"}
            alt={card.full_name}
            className="h-20 w-20 rounded-xl border border-slate-200 object-cover"
          />
        </section>

        {card.holder_type === "member" ? (
          <section className="grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs">
            <div>
              <p className="font-semibold uppercase tracking-wide text-slate-500">Valid From</p>
              <p className="mt-1 font-semibold text-slate-900">
                {formatDate(card.member_valid_from)}
              </p>
            </div>
            <div>
              <p className="font-semibold uppercase tracking-wide text-slate-500">Valid To</p>
              <p className="mt-1 font-semibold text-slate-900">
                {formatDate(card.member_valid_to)}
              </p>
            </div>
            <div>
              <p className="font-semibold uppercase tracking-wide text-slate-500">Emergency Phone</p>
              <p className="mt-1 font-semibold text-slate-900">
                {memberEmergencyPhone?.trim() || "-"}
              </p>
            </div>
            <div>
              <p className="font-semibold uppercase tracking-wide text-slate-500">Blood Group</p>
              <p className="mt-1 font-semibold text-slate-900">
                {memberBloodGroup?.trim() || "-"}
              </p>
            </div>
          </section>
        ) : null}

        {card.holder_type === "staff" ? (
          <section className="grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs">
            <div>
              <p className="font-semibold uppercase tracking-wide text-slate-500">Position</p>
              <p className="mt-1 font-semibold text-slate-900">{staffPosition?.trim() || "-"}</p>
            </div>
            <div>
              <p className="font-semibold uppercase tracking-wide text-slate-500">Father Name</p>
              <p className="mt-1 font-semibold text-slate-900">
                {staffFatherName?.trim() || "-"}
              </p>
            </div>
          </section>
        ) : null}

        <section className="grid grid-cols-[auto_1fr] items-end gap-3 rounded-xl border border-slate-200 p-3">
          <QRCodeSVG value={card.qr_value} size={72} level="M" includeMargin />
          <div className="overflow-hidden">
            <Barcode
              value={card.barcode_value}
              format="CODE128"
              width={1.15}
              height={34}
              displayValue={false}
              margin={0}
            />
            <p className="mt-1 text-center text-[11px] font-semibold tracking-wide text-slate-600">
              {card.barcode_value}
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
