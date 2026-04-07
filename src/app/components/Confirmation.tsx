import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { CheckCircle, Download, Plus, Copy, Check } from "lucide-react";
import { useCheckout } from "../context/CheckoutContext";

export const Confirmation = () => {
  const navigate = useNavigate();
  const { data, resetCheckout } = useCheckout();

  const [copied, setCopied] = useState(false);
  const [transactionNumber] = useState(
    () => "AN" + Math.random().toString().slice(2, 11).toUpperCase() + "IE"
  );

  const pdfUrl = useMemo(() => {
    return (data as typeof data & { labelPdfUrl?: string }).labelPdfUrl || "";
  }, [data]);

  const handleCopyTransaction = async () => {
    try {
      await navigator.clipboard.writeText(transactionNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleDownloadPdf = () => {
    if (!pdfUrl) return;
    const link = document.createElement("a");
    link.href = pdfUrl;
    link.download = `${transactionNumber}.pdf`;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBuyAnother = () => {
    resetCheckout();
    navigate("/step1");
  };

  return (
    <div className="py-10 px-4">
      {/* Success Header */}
      <div className="flex flex-col items-center text-center mb-8">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mb-5"
          style={{ backgroundColor: "#DCFCE7" }}
        >
          <CheckCircle
            className="w-10 h-10"
            style={{ color: "#0D6F49" }}
            strokeWidth={2}
          />
        </div>

        <h1
          className="mb-2"
          style={{
            fontFamily: "Manrope, sans-serif",
            fontSize: "26px",
            fontWeight: 700,
            color: "#111827",
            letterSpacing: "-0.02em",
          }}
        >
          Label purchased!
        </h1>

        <p
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "15px",
            color: "#6B7280",
          }}
        >
          Download and attach to your item.
        </p>
      </div>

      {/* Transaction Card */}
      <div className="max-w-md mx-auto w-full mb-6">
        <div
          className="p-4 rounded-2xl"
          style={{
            backgroundColor: "#F0FDF4",
            border: "2px solid #0D6F49",
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <span
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "12px",
                fontWeight: 600,
                color: "#0D6F49",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Transaction ID
            </span>

            <button
              onClick={handleCopyTransaction}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
              style={{
                backgroundColor: copied ? "#0D6F49" : "#DCFCE7",
                color: copied ? "#FFFFFF" : "#0D6F49",
                fontFamily: "Inter, sans-serif",
                fontSize: "12px",
                fontWeight: 600,
              }}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copy
                </>
              )}
            </button>
          </div>

          <div
            className="text-center py-2"
            style={{
              fontFamily: "monospace",
              fontSize: "18px",
              fontWeight: 700,
              color: "#111827",
              letterSpacing: "0.1em",
            }}
          >
            {transactionNumber}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="max-w-md mx-auto w-full space-y-3">
        <button
          onClick={handleDownloadPdf}
          disabled={!pdfUrl}
          className="w-full px-6 py-4 rounded-xl flex items-center justify-center gap-2"
          style={{
            backgroundColor: pdfUrl ? "#0D6F49" : "#D1D5DB",
            color: "#FFFFFF",
            fontFamily: "Inter, sans-serif",
            fontSize: "15px",
            fontWeight: 600,
            cursor: pdfUrl ? "pointer" : "not-allowed",
          }}
        >
          <Download className="w-5 h-5" />
          Download Label
        </button>

        <button
          onClick={handleBuyAnother}
          className="w-full px-6 py-3.5 rounded-xl flex items-center justify-center gap-2"
          style={{
            backgroundColor: "#FFFFFF",
            border: "2px solid #E5E7EB",
            fontFamily: "Inter, sans-serif",
            fontSize: "15px",
            fontWeight: 600,
            color: "#374151",
          }}
        >
          <Plus className="w-5 h-5" />
          Buy another label
        </button>
      </div>
    </div>
  );
};

export default Confirmation;