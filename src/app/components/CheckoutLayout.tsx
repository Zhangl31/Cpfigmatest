import React, { useMemo } from "react";
import { Outlet, useLocation } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { useCheckout } from "../context/CheckoutContext";

export const CheckoutLayout = () => {
  const location = useLocation();
  const {
    data,
    getTotalPrice,
    requiresContentsType,
  } = useCheckout();

  const currentStep =
    location.pathname === "/" || location.pathname === "/step1"
      ? 1
      : location.pathname === "/step2"
        ? 2
        : location.pathname === "/step3"
          ? 3
          : location.pathname === "/step4"
            ? 4
            : 0;

  const shouldShowTotalCost = useMemo(() => {
    if (!data.destination || !data.itemType || !data.weight) {
      return false;
    }

    if (requiresContentsType() && !data.contents) {
      return false;
    }

    return true;
  }, [
    data.destination,
    data.itemType,
    data.weight,
    data.contents,
    requiresContentsType,
  ]);

  const showBottomBar =
    currentStep > 0 && currentStep < 5 && shouldShowTotalCost;

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "#F9FAFB" }}
    >
      {/* Header */}
      <header
        className="sticky top-0 z-50 px-5 py-4 border-b"
        style={{
          backgroundColor: "#FFFFFF",
          borderColor: "#E5E7EB",
        }}
      >
        <div className="flex items-center justify-between max-w-md mx-auto">
          <div
            className="text-lg"
            style={{
              fontFamily: "Manrope, sans-serif",
              fontSize: "20px",
              fontWeight: 800,
              color: "#0D6F49",
              letterSpacing: "-0.03em",
            }}
          >
            An Post
          </div>

          {currentStep > 0 && (
            <div
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "13px",
                fontWeight: 700,
                color: "#6B7280",
                letterSpacing: "0.08em",
              }}
            >
              Step {currentStep} of 4
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {currentStep > 0 && (
          <div
            className="mt-4 h-1.5 rounded-full overflow-hidden max-w-md mx-auto"
            style={{ backgroundColor: "#E5E7EB" }}
          >
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: "#0D6F49" }}
              initial={{ width: 0 }}
              animate={{ width: `${(currentStep / 4) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        )}
      </header>

      {/* Main Content */}
      <main
        className={`max-w-md mx-auto px-5 ${
          showBottomBar ? "pb-32" : "pb-8"
        }`}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Bar */}
      {showBottomBar && (
        <div
          className="fixed bottom-0 left-0 right-0 px-5 py-4 border-t"
          style={{
            backgroundColor: "#FFFFFF",
            borderColor: "#E5E7EB",
            boxShadow: "0 -4px 16px rgba(0, 0, 0, 0.04)",
          }}
        >
          <div className="max-w-md mx-auto flex items-center justify-between">
            <div>
              <div
                className="mb-1"
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "#6B7280",
                  letterSpacing: "0.08em",
                }}
              >
                Total cost
              </div>
              <div
                style={{
                  fontFamily: "Manrope, sans-serif",
                  fontSize: "24px",
                  fontWeight: 800,
                  color: "#0D6F49",
                  letterSpacing: "-0.03em",
                }}
              >
                €{getTotalPrice().toFixed(2)}
              </div>
            </div>

            <div id="bottom-cta-container"></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckoutLayout;
