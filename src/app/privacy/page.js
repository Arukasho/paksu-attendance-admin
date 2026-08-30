export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <header className="mb-8">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white shadow-sm">
            P
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Privacy Policy
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Last updated: 30 August 2026
          </p>
        </header>

        {/* Policy */}
        <article className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="px-6 py-7 sm:px-8 sm:py-9">
            <Section title="Who we are">
              <p>
                PAKSU Attendance ("the App") is an event attendance tracking
                system operated by PAKSU for internal use by members and event
                attendees.
              </p>
            </Section>

            <Section title="What information we collect">
              <p>When you register for an account, we collect:</p>

              <List>
                <li>Full name, username, phone number, and email address</li>

                <li>
                  A password (stored securely as an irreversible hash — we
                  cannot see or recover it)
                </li>
              </List>

              <p className="mt-4">
                Optionally, through your profile, you may also provide:
              </p>

              <List>
                <li>University/institution name and student ID (Stambuk)</li>
                <li>Home/domicile address</li>
                <li>Place and date of birth</li>
                <li>A profile photo</li>
              </List>

              <p className="mt-4">
                When you check in to an event, we record the event and the
                date/time of your check-in.
              </p>
            </Section>

            <Section title="Why we collect it">
              <p>
                This information is used solely to operate the attendance
                system: identifying you, tracking which events you've attended,
                and allowing event organizers to view attendance records and
                reports.
              </p>
            </Section>

            <Section title="Who has access to your data">
              <p>
                Your data is accessible to authorized administrators of PAKSU
                through an internal admin dashboard, used to manage events and
                view attendance. We do not sell, rent, or share your personal
                data with any third party outside our organization.
              </p>
            </Section>

            <Section title="How your data is stored">
              <p>
                Data is stored in a secured PostgreSQL database (hosted via
                Supabase) and accessed through our backend service (hosted via
                Railway). Passwords are hashed using bcrypt and are never stored
                or transmitted in plain text. Profile photos are stored via
                Supabase Storage.
              </p>
            </Section>

            <Section title="Data retention and deletion">
              <p>
                We retain your data for as long as your account is active. If
                you would like your account and associated data deleted, please
                contact us using the information below — we will process
                deletion requests within 3 days, except where retaining certain
                records is required for legitimate organizational or legal
                purposes (e.g. historical attendance records).
              </p>
            </Section>

            <Section title="Your rights">
              <p>
                You may request access to, correction of, or deletion of your
                personal data at any time by contacting us. Most profile fields
                can also be updated directly within the app.
              </p>
            </Section>

            <Section title="Contact us" last>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p>
                  If you have questions about this privacy policy or your data,
                  contact us at{" "}
                  <a
                    href="mailto:alwi.jeremy@gmail.com"
                    className="font-medium text-blue-600 underline decoration-blue-200 underline-offset-2 transition hover:text-blue-700 hover:decoration-blue-400"
                  >
                    alwi.jeremy@gmail.com
                  </a>
                  .
                </p>
              </div>
            </Section>
          </div>
        </article>

        {/* Footer */}
        <footer className="mt-6 text-center text-xs text-slate-400">
          PAKSU Attendance
        </footer>
      </div>
    </main>
  );
}

function Section({ title, children, last = false }) {
  return (
    <section className={last ? "" : "mb-8 border-b border-slate-100 pb-8"}>
      <h2 className="mb-3 text-base font-bold text-slate-900">{title}</h2>

      <div className="space-y-3 text-sm leading-7 text-slate-600">
        {children}
      </div>
    </section>
  );
}

function List({ children }) {
  return (
    <ul className="list-disc space-y-2 pl-5 text-slate-600">{children}</ul>
  );
}
