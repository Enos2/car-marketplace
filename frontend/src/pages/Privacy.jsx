// =============================================================
// FILE: frontend/src/pages/Privacy.jsx
// =============================================================

export default function Privacy() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-4xl font-extrabold text-zinc-900">Privacy Policy</h1>
      <p className="mt-2 text-xs text-zinc-400">Last updated: {new Date().toLocaleDateString()}</p>

      <div className="mt-8 space-y-6 text-sm text-zinc-700 leading-relaxed">
        <section>
          <h2 className="text-lg font-bold text-zinc-900">What we collect</h2>
          <p className="mt-2">
            When you register, we collect your name, email, and optionally your
            phone number. When you list a vehicle or send an enquiry, we store
            the content of what you submit.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-zinc-900">How we use it</h2>
          <p className="mt-2">
            Your information is used to operate the marketplace: authenticating
            you, enabling contact between buyers and sellers, moderating
            listings, and preventing fraud.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-zinc-900">What we never do</h2>
          <p className="mt-2">
            We do not sell your data. We do not share your email or phone with
            other users unless you choose to send an enquiry, in which case the
            seller sees your contact details.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-zinc-900">Your rights</h2>
          <p className="mt-2">
            You can update your account information at any time. You can request
            deletion of your account and associated data by contacting us.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-zinc-900">Kenyan data protection</h2>
          <p className="mt-2">
            We handle personal data in line with the Kenya Data Protection Act
            (2019). For data-protection questions, contact us at the email
            listed in the footer.
          </p>
        </section>
      </div>
    </div>
  );
}

// =============================================================
// END OF FILE: frontend/src/pages/Privacy.jsx
// =============================================================