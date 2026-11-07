import { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
}

export default function BarcodeScanner({
  onScan,
  onClose,
}: BarcodeScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const startedRef = useRef(false);

  const [error, setError] = useState("");
  const [isStarting, setIsStarting] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const startScanner = async () => {
      try {
        const scanner = new Html5Qrcode("barcode-reader", {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.QR_CODE,
          ],
          verbose: false,
        });

        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 150 },
            aspectRatio: 1,
          },
          async (decodedText) => {
            if (cancelled || !startedRef.current) return;

            // Prevent multiple scans of the same barcode.
            startedRef.current = false;

            try {
              await scanner.stop();
            } catch (err) {
              console.error("Unable to stop scanner:", err);
            }

            if (!cancelled) {
              onScan(decodedText);
            }
          },
          () => {
            // Ignore errors while searching for a barcode.
          },
        );

        if (cancelled) {
          await scanner.stop();
          return;
        }

        startedRef.current = true;
        setIsStarting(false);
      } catch (err) {
        if (!cancelled) {
          setError(
            "Unable to open the camera. Please allow camera access and try again.",
          );
          setIsStarting(false);
        }

        console.error("Camera error:", err);
      }
    };

    void startScanner();

    return () => {
      cancelled = true;
      startedRef.current = false;

      const scanner = scannerRef.current;

      if (scanner?.isScanning) {
        void scanner.stop().catch(console.error);
      }
    };
  }, [onScan]);

  const closeScanner = async () => {
    const scanner = scannerRef.current;

    if (scanner?.isScanning) {
      try {
        await scanner.stop();
      } catch (err) {
        console.error("Unable to stop camera:", err);
      }
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Scan Barcode</h2>

          <button
            type="button"
            onClick={closeScanner}
            className="rounded-lg px-3 py-1 text-xl text-gray-600 hover:bg-gray-100"
            aria-label="Close scanner"
          >
            ✕
          </button>
        </div>

        <p className="mb-3 text-sm text-gray-600">
          Point your phone camera at the barcode.
        </p>

        <div
          id="barcode-reader"
          className="w-full overflow-hidden rounded-lg"
        />

        {isStarting && !error && (
          <p className="mt-3 text-center text-sm text-gray-500">
            Opening camera...
          </p>
        )}

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <button
          type="button"
          onClick={closeScanner}
          className="mt-4 w-full rounded-lg bg-gray-800 px-4 py-2 text-white hover:bg-gray-700"
        >
          Close Scanner
        </button>
      </div>
    </div>
  );
}
