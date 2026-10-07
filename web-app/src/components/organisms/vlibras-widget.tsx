"use client";

import Script from "next/script";

declare global {
  interface Window {
    VLibras?: {
      Widget: new (endpoint: string) => unknown;
    };
  }
}

const vlibrasMarkup = `
  <div vw class="enabled">
    <div vw-access-button class="active"></div>
    <div vw-plugin-wrapper>
      <div class="vw-plugin-top-wrapper"></div>
    </div>
  </div>
`;

export function VlibrasWidget(): React.ReactElement {
  const initializeWidget = (): void => {
    if (window.VLibras) {
      new window.VLibras.Widget("https://vlibras.gov.br/app");
    }
  };

  return (
    <>
      <div
        aria-label="Widget de acessibilidade VLibras"
        dangerouslySetInnerHTML={{ __html: vlibrasMarkup }}
      />
      <Script
        src="https://vlibras.gov.br/app/vlibras-plugin.js"
        strategy="afterInteractive"
        onReady={initializeWidget}
      />
    </>
  );
}
