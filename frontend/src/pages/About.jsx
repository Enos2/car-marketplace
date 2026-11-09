// =============================================================
// FILE: frontend/src/pages/About.jsx
// =============================================================

export default function About() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-4xl font-extrabold text-zinc-900">About Car Marketplace</h1>
      <div className="mt-8 space-y-5 text-base text-zinc-700 leading-relaxed">
        <p>
          Car Marketplace is a Kenyan vehicle marketplace connecting buyers with
          dealers and private sellers. Browse verified listings, compare prices,
          book viewings, and bid on auctions.
        </p>
        <p>
          We don't sell cars ourselves. We provide the platform where buyers and
          sellers find each other, communicate safely, and complete transactions
          directly. Every listing is reviewed before it goes live.
        </p>
        <p>
          Our goal is simple: make buying and selling a car in Kenya
          transparent, fast, and trustworthy.
        </p>
      </div>

      <div className="mt-12 grid sm:grid-cols-3 gap-6">
        <div className="rounded-xl border border-zinc-200 p-5">
          <p className="text-2xl font-extrabold text-brand-500">Listings</p>
          <p className="mt-1 text-sm text-zinc-500">Verified before publication</p>
        </div>
        <div className="rounded-xl border border-zinc-200 p-5">
          <p className="text-2xl font-extrabold text-brand-500">Viewings</p>
          <p className="mt-1 text-sm text-zinc-500">Book in seconds, no phone calls</p>
        </div>
        <div className="rounded-xl border border-zinc-200 p-5">
          <p className="text-2xl font-extrabold text-brand-500">Auctions</p>
          <p className="mt-1 text-sm text-zinc-500">Real-time bidding from your phone</p>
        </div>
      </div>
    </div>
  );
}

// =============================================================
// END OF FILE: frontend/src/pages/About.jsx
// =============================================================