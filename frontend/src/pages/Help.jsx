// =============================================================
// FILE: frontend/src/pages/Help.jsx
// =============================================================

export default function Help() {
  const faqs = [
    {
      q: 'How do I buy a car?',
      a: 'Browse listings, open a vehicle you like, and either contact the seller or book a viewing. Most transactions are completed directly with the seller.',
    },
    {
      q: 'How do I list a car for sale?',
      a: 'Create an account and choose "Sell vehicles". You can add photos, set a price, and publish. Every listing is reviewed before it appears publicly.',
    },
    {
      q: 'What does "Book a viewing" do?',
      a: 'It reserves a time slot with the seller to physically see the vehicle. Free viewings confirm immediately. Paid viewings require payment before confirmation.',
    },
    {
      q: 'How does the auction work?',
      a: 'Sellers submit a vehicle for auction with a starting price and end time. Approved auctions go live. Anyone signed in can bid. The highest bid at closing wins if the reserve is met.',
    },
    {
      q: 'Is my personal information safe?',
      a: 'Yes. Contact details are only shared with the seller when you choose to send an enquiry. Passwords are hashed, sessions are cookie-based, and account access is protected.',
    },
  ];

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-4xl font-extrabold text-zinc-900">Help & FAQ</h1>
      <p className="mt-2 text-sm text-zinc-500">Common questions about buying, selling, and bidding.</p>

      <div className="mt-10 space-y-6">
        {faqs.map((f, i) => (
          <div key={i} className="rounded-xl border border-zinc-200 bg-white p-6">
            <h2 className="text-base font-bold text-zinc-900">{f.q}</h2>
            <p className="mt-2 text-sm text-zinc-600 leading-relaxed">{f.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// =============================================================
// END OF FILE: frontend/src/pages/Help.jsx
// =============================================================