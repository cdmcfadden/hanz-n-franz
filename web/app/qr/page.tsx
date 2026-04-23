import { headers } from "next/headers";
import Link from "next/link";
import QRCode from "qrcode";
import {
  CATEGORIES,
  categoryLabels,
  type EquipmentItem,
} from "@/lib/equipment";
import { loadEquipmentData } from "@/lib/equipment-server";

// Reads request headers, so cannot be statically pre-rendered
export const dynamic = "force-dynamic";

async function makeQrSvg(url: string): Promise<string> {
  return QRCode.toString(url, {
    type: "svg",
    margin: 1,
    width: 200,
    color: { dark: "#000000", light: "#ffffff" },
  });
}

export default async function QrSheetPage() {
  const data = await loadEquipmentData();
  const h = await headers();
  const host = h.get("host") ?? "localhost:3001";
  const proto =
    h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const baseUrl = `${proto}://${host}`;

  const sections: { label: string; items: { item: EquipmentItem; url: string; svg: string }[] }[] =
    [];

  for (const cat of CATEGORIES) {
    const items = data[cat] ?? [];
    if (items.length === 0) continue;
    const decorated = await Promise.all(
      items.map(async (item) => {
        const url = `${baseUrl}/equipment/${item.id}`;
        return { item, url, svg: await makeQrSvg(url) };
      }),
    );
    sections.push({ label: categoryLabels[cat], items: decorated });
  }

  return (
    <main className="mx-auto max-w-4xl px-4 sm:px-6 py-4 sm:py-6 w-full">
      <div className="mb-6 flex items-baseline justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-white">
            QR sheet
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            One QR code per equipment item. Encodes a deep link into the
            single-item view. Print this page (Cmd+P) and stick on the
            machines.
          </p>
        </div>
        <Link
          href="/equipment"
          className="text-xs text-neutral-500 hover:text-white"
        >
          ← Equipment
        </Link>
      </div>

      <p className="mb-6 text-xs text-neutral-500 print:hidden">
        Base URL: <code className="text-white">{baseUrl}</code>. If this isn't
        your production domain, browse to the deployed Vercel URL before
        printing.
      </p>

      <div className="space-y-8">
        {sections.map((section) => (
          <section key={section.label}>
            <h2 className="text-xs font-semibold tracking-widest uppercase text-neutral-500 mb-3 print:text-black">
              {section.label}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {section.items.map(({ item, url, svg }) => (
                <div
                  key={item.id}
                  className="rounded-xl bg-white p-3 text-black break-inside-avoid"
                >
                  <div
                    className="w-full aspect-square"
                    dangerouslySetInnerHTML={{ __html: svg }}
                  />
                  <div className="mt-2 text-sm font-medium leading-tight">
                    {item.name}
                  </div>
                  <div className="text-[10px] text-neutral-500 truncate">
                    {url.replace(baseUrl, "")}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <style>{`
        @media print {
          html, body { background: white !important; }
          header, nav { display: none !important; }
        }
      `}</style>
    </main>
  );
}
