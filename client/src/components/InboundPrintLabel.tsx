import React from "react";
import { QRCodeCanvas } from "qrcode.react";

type InboundLabelProps = {
  lot_number: string;
  quantity: string | number;
  date?: string;
  pin_name?: string;
};

const InboundPrintLabel: React.FC<{ data: InboundLabelProps }> = ({ data }) => {
  const handlePrint = () => {
    const canvas = document.getElementById(
      "qr-code-canvas",
    ) as HTMLCanvasElement;

    if (!canvas) {
      alert("QR canvas element not found");
      return;
    }

    const imgData = canvas.toDataURL("image/png");
    const win = window.open("", "_blank", "width=500,height=400");

    if (win) {
      win.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Print Label</title>
            <style>
              @page {
                size: 4cm 2cm;
                margin: 0;
              }

              html, body {
                width: 4cm;
                height: 2cm;
                margin: 0;
                padding: 0;
                font-family: 'Arial', sans-serif;
                background-color: #fff;
                overflow: hidden;
              }

              .label {
                width: 4cm;
                height: 2cm;
                display: flex;
                flex-direction: row;
                align-items: center;
                justify-content: flex-start;
                padding: 2mm;
                box-sizing: border-box;
                gap: 2mm;
              }

              .qr {
                flex-shrink: 0;
                display: flex;
                align-items: center;
                justify-content: center;
              }

              .qr img {
                width: 1.6cm;
                height: 1.6cm;
                display: block;
              }

              .info {
                display: flex;
                flex-direction: column;
                justify-content: center;
                overflow: hidden;
                white-space: nowrap;
              }

              .field {
                margin-bottom: 1.5px;
              }

              .label-title {
                font-size: 6px;
                font-weight: bold;
                color: #555;
                text-transform: uppercase;
                line-height: 1;
              }

              .value {
                font-size: 8.5px;
                font-weight: bold;
                color: #000;
                line-height: 1.1;
                overflow: hidden;
                text-overflow: ellipsis;
              }
            </style>
          </head>
          <body>
            <div class="label">
              <div class="qr">
                <img src="${imgData}" alt="QR Code" />
              </div>

              <div class="info">
                <div class="field">
                  <div class="label-title">LOT NO</div>
                  <div class="value">${data.lot_number || "N/A"}</div>
                </div>

                <div class="field">
                  <div class="label-title">QTY</div>
                  <div class="value">${data.quantity ?? "0"}</div>
                </div>

                ${
                  data.date
                    ? `<div class="field">
                        <div class="label-title">DATE</div>
                        <div class="value">${data.date}</div>
                      </div>`
                    : ""
                }
              </div>
            </div>
          </body>
        </html>
      `);

      win.document.close();

      win.onload = () => {
        setTimeout(() => {
          win.print();
          win.close();
        }, 200);
      };
    }
  };

  // QR Code Payload string containing Lot Number, Qty, and Date
  const qrValue = `LOT: ${data.lot_number || ""} | QTY: ${data.quantity || ""} | DATE: ${data.date || ""}`;

  return (
    <div>
      {/* Hidden high-res canvas rendering */}
      <div style={{ position: "absolute", left: "-9999px", top: "-9999px" }}>
        <QRCodeCanvas
          id="qr-code-canvas"
          value={qrValue}
          size={300}
          level="M"
        />
      </div>

      <button
        type="button"
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm transition shadow-sm flex items-center justify-center gap-2 w-full"
        onClick={handlePrint}
      >
        🖨️ Print Label ({data.lot_number})
      </button>
    </div>
  );
};

export default InboundPrintLabel;
