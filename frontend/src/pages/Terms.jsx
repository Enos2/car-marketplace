// =============================================================
// FILE: frontend/src/pages/Terms.jsx
// =============================================================

export default function Terms() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-4xl font-extrabold text-zinc-900">Terms of Service</h1>
      <p className="mt-2 text-xs text-zinc-400">Last updated: {new Date().toLocaleDateString()}</p>

      <div className="mt-8 space-y-6 text-sm text-zinc-700 leading-relaxed">
        <section>
          <h2 className="text-lg font-bold text-zinc-900">1. The platform</h2>
          <p className="mt-2">
            Car Marketplace provides a marketplace where buyers and sellers of
            vehicles can connect. We are not a party to any transaction and we
            do not own, inspect, or warrant the vehicles listed.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-zinc-900">2. Accounts</h2>
          <p className="mt-2">
            You are responsible for the accuracy of your account information
            and for any activity that occurs under your account.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-zinc-900">3. Listings</h2>
          <p className="mt-2">
            Sellers warrant that they have the right to sell the vehicles they
            list. Listings are reviewed and may be rejected or removed at our
            discretion.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-zinc-900">4. Viewings and auctions</h2>
          <p className="mt-2">
            Viewings are arrangements between buyer and seller. Auctions are
            bound by the rules shown at the time of the auction.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-zinc-900">5. Prohibited conduct</h2>
          <p className="mt-2">
            Fraud, misrepresentation, spam, harassment, and attempts to bypass
            the platform's security are prohibited and may result in suspension
            or removal.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-zinc-900">6. Limitation of liability</h2>
          <p className="mt-2">
            To the maximum extent permitted by law, we are not liable for any
            loss arising from a transaction between users.
          </p>
        </section>
      </div>
    </div>
  );
}

// =============================================================
// END OF FILE: frontend/src/pages/Terms.jsx
// =============================================================