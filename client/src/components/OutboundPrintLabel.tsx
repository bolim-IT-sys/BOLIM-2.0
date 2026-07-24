import React from "react";
import { QRCodeCanvas } from "qrcode.react";

type OutboundLabelProps = {
  lot_number: string;
  quantity: string | number;
  destination?: string;
  date?: string;
};

const OutboundPrintLabel: React.FC<{ data: OutboundLabelProps }> = ({
  data,
}) => {
  const handlePrint = () => {
    const canvas = document.getElementById(
      "outbound-qr-canvas",
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
            <title>Outbound Dispatch Label</title>
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
                margin-bottom: 1px;
              }

              .label-title {
                font-size: 5.5px;
                font-weight: bold;
                color: #555;
                text-transform: uppercase;
                line-height: 1;
              }

              .value {
                font-size: 8px;
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
                  <div class="label-title">DISPATCH QTY</div>
                  <div class="value">${data.quantity ?? "0"}</div>
                </div>

                ${
                  data.destination
                    ? `<div class="field">
                        <div class="label-title">DESTINATION</div>
                        <div class="value">${data.destination}</div>
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

  // Dedicated Outbound QR Code payload string
  const qrValue = `OUTBOUND | LOT: ${data.lot_number || ""} | QTY: ${data.quantity || ""} | DEST: ${data.destination || "N/A"} | DATE: ${data.date || ""}`;

  return (
    <div>
      {/* Unique ID for outbound canvas to avoid DOM collisions */}
      <div style={{ position: "absolute", left: "-9999px", top: "-9999px" }}>
        <QRCodeCanvas
          id="outbound-qr-canvas"
          value={qrValue}
          size={300}
          level="M"
        />
      </div>

      <button
        type="button"
        className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold text-xs transition shadow-sm flex items-center justify-center gap-2 w-full"
        onClick={handlePrint}
      >
        🖨️ Print Dispatch Label
      </button>
    </div>
  );
};

export default OutboundPrintLabel;
