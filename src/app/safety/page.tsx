export const metadata = {
  title: "Child Safety Standards - RateMe",
};

export default function SafetyPage() {
  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
      <h1 className="text-2xl font-bold">Child Safety Standards</h1>
      <p className="text-sm text-muted-foreground">
        Last updated: February 18, 2026
      </p>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Zero Tolerance Policy</h2>
        <p>
          RateMe has a zero-tolerance policy toward child sexual abuse material
          (CSAM) and child sexual abuse and exploitation (CSAE) content of any
          kind. Any content that exploits or endangers children is strictly
          prohibited and will be immediately removed.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Content Moderation</h2>
        <p>
          All user-uploaded content is subject to review and moderation. We
          actively monitor uploads to detect and prevent the distribution of
          illegal or harmful content, including CSAM. Content that violates our
          policies will be removed promptly, and the associated accounts will be
          permanently banned.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Reporting</h2>
        <p>
          Users can report suspected CSAM or any content that exploits children
          by contacting us directly at{" "}
          <a
            href="mailto:keugenelee11@gmail.com"
            className="underline font-medium"
          >
            keugenelee11@gmail.com
          </a>
          . All reports are treated with the highest priority and
          confidentiality.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">
          Cooperation with Authorities
        </h2>
        <p>
          We comply with all applicable child safety laws and regulations. When
          we identify or receive reports of CSAM, we will:
        </p>
        <ul className="list-disc list-inside space-y-1 pl-2">
          <li>Immediately remove the content</li>
          <li>Permanently ban the offending user</li>
          <li>
            Report the incident to the National Center for Missing &amp;
            Exploited Children (NCMEC) and relevant law enforcement authorities
          </li>
          <li>Preserve evidence as required by law</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Contact</h2>
        <p>
          For child safety concerns, contact our designated point of contact:
        </p>
        <p className="font-medium">
          <a href="mailto:keugenelee11@gmail.com" className="underline">
            keugenelee11@gmail.com
          </a>
        </p>
      </section>
    </div>
  );
}
