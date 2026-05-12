"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="nl">
      <body>
        <div style={{ padding: "2rem", textAlign: "center" }}>
          <h2>Er is iets fout gegaan</h2>
          <button onClick={reset}>Probeer opnieuw</button>
        </div>
      </body>
    </html>
  );
}
