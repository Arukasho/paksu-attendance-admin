export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <header className="mb-8">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-xl">
            <img
              src="splash_icon.png"
              alt="PAKSU Attendance App Logo"
              className="h-full w-full object-contain"
            />
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Kebijakan Privasi
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Terakhir diperbarui: 30 Agustus 2026
          </p>
        </header>

        {/* Policy */}
        <article className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="px-6 py-7 sm:px-8 sm:py-9">
            <Section title="Tentang Kami">
              <p>
                PAKSU Attendance App adalah sistem pencatatan kehadiran acara
                yang dioperasikan oleh PAKSU untuk penggunaan internal oleh
                anggota dan peserta acara.
              </p>
            </Section>

            <Section title="Informasi yang Kami Kumpulkan">
              <p>Saat Anda mendaftarkan akun, kami mengumpulkan:</p>

              <List>
                <li>Nama lengkap, username, nomor telepon, dan alamat email</li>

                <li>
                  Kata sandi (disimpan secara aman dalam bentuk hash yang tidak
                  dapat dikembalikan ke bentuk semula — kami tidak dapat melihat
                  atau memulihkannya)
                </li>
              </List>

              <p className="mt-4">
                Secara opsional, melalui profil Anda, Anda juga dapat
                memberikan:
              </p>

              <List>
                <li>Nama universitas/institusi dan Stambuk</li>
                <li>Alamat tempat tinggal/domisili</li>
                <li>Tempat dan tanggal lahir</li>
                <li>Foto profil</li>
              </List>

              <p className="mt-4">
                Saat Anda melakukan check-in pada suatu acara/kegiatan, kami
                mencatat acara tersebut serta tanggal dan waktu check-in Anda.
              </p>
            </Section>

            <Section title="Mengapa Kami Mengumpulkan Informasi Tersebut">
              <p>
                Informasi ini digunakan semata-mata untuk menjalankan sistem
                kehadiran, yaitu untuk mengidentifikasi Anda, mencatat acara
                yang telah Anda hadiri, serta memungkinkan pengurus PAKSU untuk
                melihat catatan dan laporan kehadiran.
              </p>
            </Section>

            <Section title="Siapa yang Memiliki Akses ke Data Anda">
              <p>
                Data Anda dapat diakses oleh admin PAKSU yang berwenang melalui
                dashboard admin internal, yang digunakan untuk mengelola acara
                dan melihat data kehadiran. Kami tidak menjual, menyewakan, atau
                membagikan data pribadi Anda kepada pihak ketiga di luar PAKSU.
              </p>
            </Section>

            <Section title="Bagaimana Data Anda Disimpan">
              <p>
                Data disimpan dalam database PostgreSQL yang diamankan dan
                di-host melalui Supabase, serta diakses melalui layanan backend
                kami yang di-host melalui Railway. Kata sandi di-hash
                menggunakan bcrypt dan tidak pernah disimpan atau dikirim dalam
                bentuk teks biasa. Foto profil disimpan melalui Supabase
                Storage.
              </p>
            </Section>

            <Section title="Penyimpanan dan Penghapusan Data">
              <p>
                Kami menyimpan data Anda selama akun Anda masih aktif. Jika Anda
                ingin akun dan data terkait Anda dihapus, silakan hubungi kami
                melalui informasi kontak di bawah ini. Kami akan memproses
                permintaan penghapusan dalam waktu 3-7 hari, kecuali apabila
                penyimpanan data tertentu diperlukan untuk kepentingan
                organisasi atau hukum yang sah.
              </p>
            </Section>

            <Section title="Hak Anda">
              <p>
                Anda dapat meminta akses, perbaikan, atau penghapusan data
                pribadi Anda kapan saja dengan menghubungi kami. Sebagian besar
                informasi profil juga dapat diperbarui secara langsung melalui
                aplikasi.
              </p>
            </Section>

            <Section title="Hubungi Kami" last>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p>
                  Jika Anda memiliki pertanyaan mengenai kebijakan privasi ini
                  atau data Anda, silakan hubungi kami melalui{" "}
                  <a
                    href="mailto:alwijeremy@gmail.com"
                    className="font-medium text-blue-600 underline decoration-blue-200 underline-offset-2 transition hover:text-blue-700 hover:decoration-blue-400"
                  >
                    alwijeremy@gmail.com
                  </a>
                  .
                </p>
              </div>
            </Section>
          </div>
        </article>

        {/* Footer */}
        <footer className="mt-6 text-center text-xs text-slate-400">
          ©2026 PAKSU Attendance App. All rights reserved.
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
