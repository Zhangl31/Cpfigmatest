import React, {
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router";
import {
  Gift,
  Building2,
  FileText,
  Search,
  Info,
  ArrowLeft,
  ArrowRight,
  Check,
  X,
  Sparkles,
  RotateCcw,
  Briefcase,
} from "lucide-react";
import {
  motion,
  AnimatePresence,
  useReducedMotion,
} from "motion/react";
import {
  useCheckout,
  type CustomsType,
} from "../context/CheckoutContext";

/* ─────────────────────────────────────────────────────────────
   Haptic Feedback Utility
───────────────────────────────────────────────────────────── */

const haptic = {
  light: () => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(10);
    }
  },
  medium: () => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(20);
    }
  },
  success: () => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate([10, 50, 20]);
    }
  },
};

/* ─────────────────────────────────────────────────────────────
   Constants
───────────────────────────────────────────────────────────── */

const DDP_THRESHOLD = 170;

const GOODS_CUSTOMS_TYPES = [
  {
    value: "sale_of_goods" as CustomsType,
    icon: Building2,
    label: "Sale of Goods",
  },
  { value: "gift" as CustomsType, icon: Gift, label: "Gift" },
  {
    value: "returned_goods" as CustomsType,
    icon: RotateCcw,
    label: "Returned Goods",
  },
  {
    value: "commercial_sample" as CustomsType,
    icon: Briefcase,
    label: "Commercial Sample",
  },
];

const DOCUMENTS_CUSTOMS_TYPES = [
  {
    value: "documents" as CustomsType,
    icon: FileText,
    label: "Documents",
  },
];

const easeOut = [0.22, 1, 0.36, 1] as const;

/* ─────────────────────────────────────────────────────────────
   Helper: Get region from destination
───────────────────────────────────────────────────────────── */

type Region = "ROI" | "NI" | "GB" | "EU" | "ROW";

const DESTINATION_REGIONS: Record<string, Region> = {
  Ireland: "ROI",
  "Northern Ireland": "NI",
  "United Kingdom": "GB",
  Germany: "EU",
  France: "EU",
  Spain: "EU",
  Italy: "EU",
  Netherlands: "EU",
  Belgium: "EU",
  Portugal: "EU",
  Austria: "EU",
  Poland: "EU",
  "United States": "ROW",
  Australia: "ROW",
  Canada: "ROW",
  Japan: "ROW",
  China: "ROW",
};

function getRegion(destination: string): Region {
  return DESTINATION_REGIONS[destination] || "ROW";
}

/* ─────────────────────────────────────────────────────────────
   Helper: Determine customs requirements
───────────────────────────────────────────────────────────── */

type CustomsLevel = "none" | "simple" | "full";

function getCustomsLevel(destination: string): CustomsLevel {
  const region = getRegion(destination);

  switch (region) {
    case "ROI":
    case "NI":
      return "none";
    case "EU":
      return "simple";
    case "GB":
    case "ROW":
      return "full";
    default:
      return "full";
  }
}

function requiresTaricCode(destination: string): boolean {
  const region = getRegion(destination);
  return region === "GB" || region === "ROW";
}

function showDdpRecommendation(
  destination: string,
  value: number,
  ddpAlreadySelected: boolean,
): boolean {
  const region = getRegion(destination);
  return (
    region === "GB" &&
    value > DDP_THRESHOLD &&
    !ddpAlreadySelected
  );
}

/* ─────────────────────────────────────────────────────────────
   Ripple Effect Hook
───────────────────────────────────────────────────────────── */

interface RippleState {
  x: number;
  y: number;
  id: number;
}

function useRipple() {
  const [ripples, setRipples] = useState<RippleState[]>([]);
  const nextId = useRef(0);

  const createRipple = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const id = nextId.current++;

      setRipples((prev) => [...prev, { x, y, id }]);

      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== id));
      }, 600);
    },
    [],
  );

  return { ripples, createRipple };
}

function RippleContainer({
  ripples,
}: {
  ripples: RippleState[];
}) {
  const prefersReducedMotion = useReducedMotion();
  if (prefersReducedMotion) return null;

  return (
    <>
      {ripples.map((ripple) => (
        <motion.span
          key={ripple.id}
          initial={{ scale: 0, opacity: 0.5 }}
          animate={{ scale: 4, opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          style={{
            position: "absolute",
            left: ripple.x,
            top: ripple.y,
            width: 20,
            height: 20,
            borderRadius: "50%",
            backgroundColor: "rgba(13, 111, 73, 0.2)",
            transform: "translate(-50%, -50%)",
            pointerEvents: "none",
          }}
        />
      ))}
    </>
  );
}

/* ─────────────────────────────────────────────────────────────
   Animated Checkmark Component
───────────────────────────────────────────────────────────── */

function AnimatedCheckmark({ size = 12 }: { size?: number }) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={
        prefersReducedMotion ? {} : { scale: 0, rotate: -45 }
      }
      animate={
        prefersReducedMotion ? {} : { scale: 1, rotate: 0 }
      }
      transition={{
        type: "spring",
        stiffness: 500,
        damping: 25,
        delay: 0.1,
      }}
    >
      <Check
        className="text-white"
        style={{ width: size, height: size }}
      />
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Reusable Components
───────────────────────────────────────────────────────────── */

function SectionLabel({
  children,
  optional = false,
}: {
  children: React.ReactNode;
  optional?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <label
        style={{
          fontFamily: "Inter, sans-serif",
          fontSize: "14px",
          fontWeight: 600,
          color: "#111827",
        }}
      >
        {children}
      </label>
      {optional && (
        <span
          className="px-2 py-0.5 rounded"
          style={{
            backgroundColor: "#F3F4F6",
            fontFamily: "Inter, sans-serif",
            fontSize: "11px",
            fontWeight: 600,
            color: "#6B7280",
          }}
        >
          Optional
        </span>
      )}
    </div>
  );
}

function HelperText({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <p
      className="mt-2"
      style={{
        fontFamily: "Inter, sans-serif",
        fontSize: "12px",
        fontWeight: 400,
        color: "#6B7280",
      }}
    >
      {children}
    </p>
  );
}

/* ─────────────────────────────────────────────────────────────
   Customs Type Card Component
───────────────────────────────────────────────────────────── */

interface CustomsTypeCardProps {
  icon: React.ElementType;
  label: string;
  isSelected: boolean;
  onClick: () => void;
}

function CustomsTypeCard({
  icon: Icon,
  label,
  isSelected,
  onClick,
}: CustomsTypeCardProps) {
  const { ripples, createRipple } = useRipple();
  const prefersReducedMotion = useReducedMotion();

  const handleClick = (
    e: React.MouseEvent<HTMLButtonElement>,
  ) => {
    createRipple(e);
    haptic.medium();
    onClick();
  };

  return (
    <motion.button
      whileTap={prefersReducedMotion ? {} : { scale: 0.95 }}
      onClick={handleClick}
      className="relative p-4 rounded-xl flex flex-col items-center gap-2 transition-all overflow-hidden"
      style={{
        backgroundColor: isSelected ? "#F0FDF4" : "#FFFFFF",
        border: isSelected
          ? "2px solid #0D6F49"
          : "2px solid #E5E7EB",
        boxShadow: isSelected
          ? "0 4px 12px rgba(13, 111, 73, 0.12)"
          : "0 1px 3px rgba(0, 0, 0, 0.05)",
      }}
    >
      <RippleContainer ripples={ripples} />

      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center"
        style={{
          backgroundColor: isSelected ? "#DCFCE7" : "#F3F4F6",
        }}
      >
        <Icon
          className="w-5 h-5"
          style={{ color: isSelected ? "#0D6F49" : "#6B7280" }}
        />
      </div>

      <span
        style={{
          fontFamily: "Inter, sans-serif",
          fontSize: "13px",
          fontWeight: 600,
          color: isSelected ? "#0D6F49" : "#111827",
        }}
      >
        {label}
      </span>

      <AnimatePresence>
        {isSelected && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{
              type: "spring",
              stiffness: 500,
              damping: 30,
            }}
            className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "#0D6F49" }}
          >
            <AnimatedCheckmark size={12} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

/* ─────────────────────────────────────────────────────────────
   DDP Recommendation Banner (Light Green)
───────────────────────────────────────────────────────────── */

interface DdpBannerProps {
  onAddDdp: () => void;
}

function DdpBanner({ onAddDdp }: DdpBannerProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={
        prefersReducedMotion ? {} : { opacity: 0, y: -10 }
      }
      animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
      exit={prefersReducedMotion ? {} : { opacity: 0, y: -10 }}
      className="p-4 rounded-xl"
      style={{
        backgroundColor: "#ECFDF5",
        border: "1px solid #A7F3D0",
      }}
    >
      <div className="flex gap-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: "#D1FAE5" }}
        >
          <Info
            className="w-5 h-5"
            style={{ color: "#059669" }}
          />
        </div>

        <div className="flex-1">
          <h4
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "14px",
              fontWeight: 600,
              color: "#065F46",
              marginBottom: "4px",
            }}
          >
            Recommended: Prepay customs (DDP)
          </h4>
          <p
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "13px",
              fontWeight: 400,
              color: "#047857",
              lineHeight: "1.5",
              marginBottom: "12px",
            }}
          >
            For items over €170 to UK, prepay customs duties so
            your recipient doesn&apos;t face surprise fees on
            delivery.
          </p>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              haptic.success();
              onAddDdp();
            }}
            className="px-4 py-2.5 rounded-lg flex items-center gap-2"
            style={{
              backgroundColor: "#059669",
              color: "#FFFFFF",
              fontFamily: "Inter, sans-serif",
              fontSize: "14px",
              fontWeight: 600,
              boxShadow: "0 2px 8px rgba(5, 150, 105, 0.3)",
            }}
          >
            <Sparkles className="w-4 h-4" />
            Add DDP (+€4.00)
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Main Component
───────────────────────────────────────────────────────────── */

export const Step2Customs = () => {
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const { data, updateData } = useCheckout();

  const [ctaContainer, setCtaContainer] =
    useState<HTMLElement | null>(null);
  const [foundTaricCode, setFoundTaricCode] = useState("");

  useEffect(() => {
    setCtaContainer(
      document.getElementById("bottom-cta-container"),
    );
  }, []);

  const customsLevel = useMemo(
    () => getCustomsLevel(data.destination),
    [data.destination],
  );

  const needsTaric = useMemo(
    () => requiresTaricCode(data.destination),
    [data.destination],
  );

  const showDdpBanner = useMemo(
    () =>
      showDdpRecommendation(
        data.destination,
        data.declaredValue,
        data.addOns.ddp,
      ),
    [data.destination, data.declaredValue, data.addOns.ddp],
  );

  const isDocumentsOnly = data.contents === "documents only";

  const availableCustomsTypes = useMemo(() => {
    return isDocumentsOnly
      ? DOCUMENTS_CUSTOMS_TYPES
      : GOODS_CUSTOMS_TYPES;
  }, [isDocumentsOnly]);

  useEffect(() => {
    if (isDocumentsOnly && data.customsType !== "documents") {
      updateData({ customsType: "documents" });
    }
  }, [isDocumentsOnly, data.customsType, updateData]);

  useEffect(() => {
    if (customsLevel === "none") {
      navigate("/step3");
    }
  }, [customsLevel, navigate]);

  const isFormValid = useMemo(() => {
    if (!data.customsType) return false;
    if (
      !data.itemDescription ||
      data.itemDescription.trim().length < 3
    ) {
      return false;
    }
    if (!data.declaredValue || data.declaredValue <= 0)
      return false;
    if (needsTaric && !data.taricCode.trim()) return false;
    return true;
  }, [
    data.customsType,
    data.itemDescription,
    data.declaredValue,
    data.taricCode,
    needsTaric,
  ]);

  const handleCustomsTypeSelect = (type: CustomsType) => {
    haptic.medium();
    updateData({ customsType: type });
  };

  const handleFindTaricCode = () => {
    if (!data.itemDescription.trim()) return;

    haptic.success();
    updateData({ taricCode: "10092" });
    setFoundTaricCode("10092");
  };

  const handleAddDdp = () => {
    updateData({
      addOns: {
        ...data.addOns,
        ddp: true,
      },
    });
  };

  const handleContinue = () => {
    if (!isFormValid) return;
    haptic.success();
    navigate("/step3");
  };

  if (customsLevel === "none") {
    return null;
  }

  const region = getRegion(data.destination);
  const isEuSimple = customsLevel === "simple";

  return (
    <div className="py-6 space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate("/step1")}
        className="flex items-center gap-2 -ml-2 p-2"
        style={{
          fontFamily: "Inter, sans-serif",
          fontSize: "14px",
          fontWeight: 500,
          color: "#0D6F49",
        }}
      >
        <ArrowLeft className="w-5 h-5" />
        Back
      </button>

      {/* Header */}
      <div>
        <h1
          className="mb-2"
          style={{
            fontFamily: "Manrope, sans-serif",
            fontSize: "26px",
            fontWeight: 700,
            color: "#111827",
            letterSpacing: "-0.02em",
            lineHeight: "1.3",
          }}
        >
          {isEuSimple
            ? "Confirm your shipment"
            : "Customs Information"}
        </h1>
        <p
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "14px",
            fontWeight: 400,
            color: "#6B7280",
            lineHeight: "1.5",
          }}
        >
          {isEuSimple
            ? "A few details about what you&apos;re sending"
            : `Required for shipments to ${data.destination}`}
        </p>
      </div>

      {/* Item Type Selector */}
      <motion.div
        initial={
          prefersReducedMotion ? {} : { opacity: 0, y: 10 }
        }
        animate={
          prefersReducedMotion ? {} : { opacity: 1, y: 0 }
        }
        transition={{ duration: 0.24, ease: easeOut }}
      >
        <SectionLabel>
          What type of shipment is this?
        </SectionLabel>

        {isDocumentsOnly ? (
          <div
            className="p-4 rounded-xl flex items-center gap-3"
            style={{
              backgroundColor: "#F0FDF4",
              border: "2px solid #0D6F49",
            }}
          >
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: "#DCFCE7" }}
            >
              <FileText
                className="w-5 h-5"
                style={{ color: "#0D6F49" }}
              />
            </div>
            <div className="flex-1">
              <p
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "15px",
                  fontWeight: 600,
                  color: "#0D6F49",
                }}
              >
                Documents
              </p>
              <p
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "12px",
                  fontWeight: 400,
                  color: "#6B7280",
                }}
              >
                Based on your selection in Step 1
              </p>
            </div>
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "#0D6F49" }}
            >
              <Check className="w-4 h-4 text-white" />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {availableCustomsTypes.map(
              ({ value, icon, label }) => (
                <CustomsTypeCard
                  key={value}
                  icon={icon}
                  label={label}
                  isSelected={data.customsType === value}
                  onClick={() => handleCustomsTypeSelect(value)}
                />
              ),
            )}
          </div>
        )}
      </motion.div>

      {/* Combined Description + TARIC Finder */}
      <motion.div
        initial={
          prefersReducedMotion ? {} : { opacity: 0, y: 10 }
        }
        animate={
          prefersReducedMotion ? {} : { opacity: 1, y: 0 }
        }
        transition={{
          duration: 0.24,
          delay: 0.05,
          ease: easeOut,
        }}
      >
        <SectionLabel>
          {isDocumentsOnly
            ? "Describe your documents"
            : "Describe your item"}
        </SectionLabel>

        <input
          type="text"
          placeholder={
            isDocumentsOnly
              ? "e.g. Legal contracts, business correspondence"
              : "e.g. 2x cotton t-shirts, 1x leather wallet"
          }
          value={data.itemDescription}
          onChange={(e) => {
            updateData({
              itemDescription: e.target.value,
              taricCode: "",
            });
            setFoundTaricCode("");
          }}
          className="w-full px-4 py-3.5 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-[#0D6F49]/20"
          style={{
            backgroundColor: "#FFFFFF",
            border: data.itemDescription
              ? "2px solid #0D6F49"
              : "2px solid #E5E7EB",
            fontFamily: "Inter, sans-serif",
            fontSize: "15px",
            fontWeight: 400,
            color: "#111827",
          }}
        />

        <div className="mt-3 flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={handleFindTaricCode}
            disabled={!data.itemDescription.trim()}
            className="px-4 py-2.5 rounded-xl flex items-center gap-2 disabled:cursor-not-allowed"
            style={{
              backgroundColor: "#0D6F49",
              color: "#FFFFFF",
              fontFamily: "Inter, sans-serif",
              fontSize: "14px",
              fontWeight: 600,
              opacity: data.itemDescription.trim() ? 1 : 0.45,
            }}
          >
            <Search className="w-4 h-4" />
            Find TARIC code
          </button>

          {foundTaricCode && (
            <div
              className="px-3 py-2 rounded-xl"
              style={{
                backgroundColor: "#F0FDF4",
                border: "1px solid #BBF7D0",
              }}
            >
              <span
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#0D6F49",
                }}
              >
                TARIC code: {foundTaricCode}
              </span>
            </div>
          )}
        </div>

        <HelperText>
          {needsTaric
            ? "Enter a description, then use Find TARIC code."
            : "Enter a description of what you are sending."}
        </HelperText>
      </motion.div>

      {/* Declared Value */}
      <motion.div
        initial={
          prefersReducedMotion ? {} : { opacity: 0, y: 10 }
        }
        animate={
          prefersReducedMotion ? {} : { opacity: 1, y: 0 }
        }
        transition={{
          duration: 0.24,
          delay: 0.1,
          ease: easeOut,
        }}
      >
        <SectionLabel>Total value of items</SectionLabel>
        <div className="relative">
          <span
            className="absolute left-4 top-1/2 -translate-y-1/2"
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "15px",
              fontWeight: 600,
              color: "#6B7280",
            }}
          >
            €
          </span>
          <input
            type="number"
            inputMode="decimal"
            placeholder="0.00"
            value={data.declaredValue || ""}
            onChange={(e) =>
              updateData({
                declaredValue: parseFloat(e.target.value) || 0,
              })
            }
            className="w-full pl-9 pr-4 py-3.5 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-[#0D6F49]/20"
            style={{
              backgroundColor: "#FFFFFF",
              border:
                data.declaredValue > 0
                  ? "2px solid #0D6F49"
                  : "2px solid #E5E7EB",
              fontFamily: "Inter, sans-serif",
              fontSize: "15px",
              fontWeight: 400,
              color: "#111827",
            }}
          />
        </div>
        {region === "GB" && (
          <HelperText>
            Items over €170 may incur customs duties for your
            recipient
          </HelperText>
        )}
      </motion.div>

      {/* DDP Recommendation */}
      <AnimatePresence>
        {showDdpBanner && (
          <motion.div
            initial={
              prefersReducedMotion
                ? {}
                : { opacity: 0, height: 0 }
            }
            animate={
              prefersReducedMotion
                ? {}
                : { opacity: 1, height: "auto" }
            }
            exit={
              prefersReducedMotion
                ? {}
                : { opacity: 0, height: 0 }
            }
          >
            <DdpBanner onAddDdp={handleAddDdp} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* DDP Added Confirmation */}
      <AnimatePresence>
        {data.addOns.ddp && region === "GB" && (
          <motion.div
            initial={
              prefersReducedMotion ? {} : { opacity: 0, y: -10 }
            }
            animate={
              prefersReducedMotion ? {} : { opacity: 1, y: 0 }
            }
            exit={
              prefersReducedMotion ? {} : { opacity: 0, y: -10 }
            }
            className="p-4 rounded-xl flex items-center gap-3"
            style={{
              backgroundColor: "#F0FDF4",
              border: "2px solid #0D6F49",
            }}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "#0D6F49" }}
            >
              <Check className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <p
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#0D6F49",
                }}
              >
                DDP added — customs prepaid for your recipient
              </p>
            </div>
            <button
              onClick={() =>
                updateData({
                  addOns: { ...data.addOns, ddp: false },
                })
              }
              className="p-1"
            >
              <X
                className="w-4 h-4"
                style={{ color: "#6B7280" }}
              />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CTA Button Portal */}
      {ctaContainer &&
        createPortal(
          <motion.button
            onClick={handleContinue}
            disabled={!isFormValid}
            whileTap={
              prefersReducedMotion || !isFormValid
                ? {}
                : { scale: 0.97 }
            }
            className="px-7 py-3.5 rounded-xl transition-all flex items-center gap-2 disabled:cursor-not-allowed"
            style={{
              backgroundColor: "#0D6F49",
              color: "#FFFFFF",
              fontFamily: "Inter, sans-serif",
              fontSize: "15px",
              fontWeight: 600,
              opacity: isFormValid ? 1 : 0.4,
              boxShadow: isFormValid
                ? "0 4px 16px rgba(13, 111, 73, 0.24)"
                : "none",
            }}
          >
            Continue
            <motion.div
              animate={
                isFormValid && !prefersReducedMotion
                  ? { x: [0, 4, 0] }
                  : {}
              }
              transition={{
                duration: 1.2,
                repeat: Infinity,
                repeatType: "loop",
                ease: "easeInOut",
              }}
            >
              <ArrowRight className="w-4 h-4" />
            </motion.div>
          </motion.button>,
          ctaContainer,
        )}
    </div>
  );
};

export const Step2 = Step2Customs;
export default Step2Customs;
