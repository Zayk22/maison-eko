import { notFound } from "next/navigation";
import { getOrderWithItems } from "@/server/queries";
import { formatMoney } from "@/lib/money";

type Params = Promise<{ orderNumber: string }>;

export default async function ConfirmationPage({
  params,
}: {
  params: Params;
}) {
  const { orderNumber } = await params;
  const order = await getOrderWithItems(orderNumber);
  if (!order) notFound();

  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
  let whatsappUrl: string | null = null;
  if (whatsappNumber && whatsappNumber.trim().length > 0) {
    const lines = [
      `Order ${order.orderNumber} from Maison Eko.`,
      `Items: ${order.items
        .map((i) => `${i.quantity}x ${i.productName} (${i.sizeMl}ml)`)
        .join(", ")}`,
      `Total: ${formatMoney(order.totalKobo)}`,
    ];
    const text = encodeURIComponent(lines.join("\n"));
    whatsappUrl = `https://wa.me/${whatsappNumber}?text=${text}`;
  }

  const bankName = process.env.DEMO_BANK_NAME || "";
  const accountName = process.env.DEMO_ACCOUNT_NAME || "";
  const accountNumber = process.env.DEMO_ACCOUNT_NUMBER || "";

  return (
    <div className="mx-auto max-w-2xl px-4 md:px-8 py-12 md:py-16">
      <div className="mb-10">
        <h1 className="font-display text-3xl md:text-5xl text-ink mb-3">
          Order received
        </h1>
        <p className="text-sm text-muted">
          Your order number is{" "}
          <strong className="text-ink tabular-nums">{order.orderNumber}</strong>.
          Keep it safe. You will need it together with the phone number you
          used to track your order.
        </p>
      </div>

      <div className="bg-surface border border-border rounded-card p-6 md:p-8 mb-8">
        <h2 className="text-sm font-medium text-ink mb-4">Items</h2>
        <ul className="space-y-3">
          {order.items.map((item) => (
            <li
              key={item.id}
              className="flex justify-between gap-4 text-sm"
            >
              <div>
                <p className="text-ink">{item.productName}</p>
                <p className="text-xs text-muted">
                  {item.sizeMl} ml &times; {item.quantity} &middot;{" "}
                  {formatMoney(item.unitPriceKobo)} each
                </p>
              </div>
              <p className="text-ink tabular-nums shrink-0">
                {formatMoney(item.lineTotalKobo)}
              </p>
            </li>
          ))}
        </ul>
        <div className="border-t border-border mt-4 pt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted">Subtotal</span>
            <span className="text-ink tabular-nums">
              {formatMoney(order.subtotalKobo)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Shipping</span>
            <span className="text-ink tabular-nums">
              {formatMoney(order.shippingKobo)}
            </span>
          </div>
          <div className="flex justify-between font-medium pt-2 border-t border-border">
            <span className="text-ink">Total</span>
            <span className="text-ink tabular-nums">
              {formatMoney(order.totalKobo)}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-card p-6 md:p-8 mb-8">
        <h2 className="text-sm font-medium text-ink mb-2">
          Bank transfer details (demo only)
        </h2>
        <p className="text-sm text-muted mb-4">
          Please transfer the total to the account below. Use your order
          number as the transfer description. These are demo-only details; no
          real orders are fulfilled.
        </p>
        <dl className="space-y-1 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Bank</dt>
            <dd className="text-ink">{bankName}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Account name</dt>
            <dd className="text-ink">{accountName}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Account number</dt>
            <dd className="text-ink tabular-nums">{accountNumber}</dd>
          </div>
        </dl>
      </div>

      {whatsappUrl && (
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex w-full items-center justify-center min-h-11 rounded-control bg-ink px-6 text-sm font-medium text-bg hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
        >
          Send order on WhatsApp
        </a>
      )}
    </div>
  );
}