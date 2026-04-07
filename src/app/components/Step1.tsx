import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
} from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router";
import {
  Mail,
  Package,
  ChevronDown,
  ArrowRight,
  ArrowLeft,
  Check,
  Truck,
  Shield,
  ShieldPlus,
  FileCheck,
  Zap,
  Sparkles,
} from "lucide-react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "motion/react";
import {
  useCheckout,
  type ItemType,
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

const SERVICE_OPTIONS = [
  {
    type: "letter" as ItemType,
    icon: Mail,
    label: "Letter or Postcard",
    shortLabel: "Letter",
    description: "Up to 100g",
    maxWeight: 0.1,
    weightTiers: [0.1],
  },
  {
    type: "large-envelope" as ItemType,
    icon: Mail,
    label: "Large Envelope",
    shortLabel: "Large Envelope",
    description: "Up to 500g",
    maxWeight: 0.5,
    weightTiers: [0.1, 0.25, 0.5],
  },
  {
    type: "small-packet" as ItemType,
    icon: Package,
    label: "Small Packet",
    shortLabel: "Small Packet",
    description: "Up to 2kg",
    maxWeight: 2,
    weightTiers: [0.1, 0.25, 0.5, 2],
  },
  {
    type: "parcel" as ItemType,
    icon: Package,
    label: "Parcel",
    shortLabel: "Parcel",
    description: "Up to 20kg",
    maxWeight: 20,
    weightTiers: [2, 5, 15, 20],
  },
];

const DESTINATIONS = [
  { value: "Ireland", region: "ROI", flag: "🇮🇪" },
  { value: "Northern Ireland", region: "NI", flag: "🇬🇧" },
  { value: "United Kingdom", region: "GB", flag: "🇬🇧" },
  { value: "Germany", region: "EU", flag: "🇩🇪" },
  { value: "France", region: "EU", flag: "🇫🇷" },
  { value: "Spain", region: "EU", flag: "🇪🇸" },
  { value: "United States", region: "ROW", flag: "🇺🇸" },
  { value: "Australia", region: "ROW", flag: "🇦🇺" },
  { value: "Canada", region: "ROW", flag: "🇨🇦" },
];

const CONTENTS_OPTIONS = [
  { value: "documents only" as const, label: "Documents only" },
  { value: "goods" as const, label: "Goods" },
];

// Add-on definitions with pricing and badges
const ADD_ON_DEFINITIONS = {
  tracking: {
    key: "tracking",
    label: "Tracking",
    description: "Track your item online",
    price: 1.5,
    icon: Truck,
  },
  express: {
    key: "express",
    label: "Express Delivery",
    description: "Next day delivery",
    price: 3.0,
    icon: Zap,
    badge: "FAST",
    badgeColor: "#F59E0B",
  },
  insuranceSignature: {
    key: "insuranceSignature",
    label: "Insurance & Signature",
    description: "Cover up to €100 + signature required",
    price: 2.5,
    icon: Shield,
  },
  insurance: {
    key: "insurance",
    label: "Insurance",
    description: "Cover up to €100",
    price: 2.0,
    icon: Shield,
  },
  additionalInsurance: {
    key: "additionalInsurance",
    label: "Additional Insurance",
    description: "Extra cover up to €500",
    price: 5.0,
    icon: ShieldPlus,
    badge: "MAX",
    badgeColor: "#6366F1",
  },
  ddp: {
    key: "ddp",
    label: "Send as DDP",
    description: "Prepay customs for receiver",
    price: 4.0,
    icon: FileCheck,
    badge: "NEW",
    badgeColor: "#0D6F49",
  },
};

const easeOut = [0.22, 1, 0.36, 1] as const;

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
   PulseGlow Component
───────────────────────────────────────────────────────────── */

function PulseGlow({ isActive }: { isActive: boolean }) {
  const prefersReducedMotion = useReducedMotion();

  if (!isActive || prefersReducedMotion) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: [0.3, 0.6, 0.3] }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      style={{
        position: "absolute",
        inset: -2,
        borderRadius: "inherit",
        background:
          "radial-gradient(circle at center, rgba(13, 111, 73, 0.15) 0%, transparent 70%)",
        pointerEvents: "none",
      }}
    />
  );
}

/* ─────────────────────────────────────────────────────────────
   Floating Badge Component
───────────────────────────────────────────────────────────── */

function FloatingBadge({
  text,
  color,
}: {
  text: string;
  color: string;
}) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.span
      initial={
        prefersReducedMotion ? {} : { scale: 0.8, opacity: 0 }
      }
      animate={
        prefersReducedMotion ? {} : { scale: 1, opacity: 1 }
      }
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 20,
      }}
      style={{
        position: "absolute",
        top: -8,
        right: -8,
        backgroundColor: color,
        color: "#FFFFFF",
        fontSize: "10px",
        fontWeight: 700,
        fontFamily: "Inter, sans-serif",
        padding: "2px 6px",
        borderRadius: "6px",
        boxShadow: `0 2px 8px ${color}40`,
        border: "2px solid #FFFFFF",
        letterSpacing: "0.02em",
      }}
    >
      {text}
    </motion.span>
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
        className={`w-${size / 4} h-${size / 4} text-white`}
        style={{ width: size, height: size }}
      />
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Shine Effect Component
───────────────────────────────────────────────────────────── */

function ShineEffect({ isActive }: { isActive: boolean }) {
  const prefersReducedMotion = useReducedMotion();

  if (!isActive || prefersReducedMotion) return null;

  return (
    <motion.div
      initial={{ x: "-100%" }}
      animate={{ x: "200%" }}
      transition={{
        duration: 1.5,
        delay: 0.2,
        ease: "easeInOut",
      }}
      style={{
        position: "absolute",
        inset: 0,
        background:
          "linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.3) 50%, transparent 100%)",
        pointerEvents: "none",
      }}
    />
  );
}

/* ─────────────────────────────────────────────────────────────
   Helper: Get region from destination
───────────────────────────────────────────────────────────── */

function getRegion(
  destination: string,
): "ROI" | "NI" | "GB" | "EU" | "ROW" {
  const dest = DESTINATIONS.find(
    (d) => d.value === destination,
  );
  return (
    (dest?.region as "ROI" | "NI" | "GB" | "EU" | "ROW") ||
    "ROI"
  );
}

function getFlag(destination: string): string {
  const dest = DESTINATIONS.find(
    (d) => d.value === destination,
  );
  return dest?.flag || "";
}

/* ─────────────────────────────────────────────────────────────
   Helper: Get available add-ons based on item type, destination, contents
───────────────────────────────────────────────────────────── */

type AddOnConfig = {
  key: string;
  label: string;
  description: string;
  price: number;
  icon: React.ElementType;
  included?: boolean;
  badge?: string;
  badgeColor?: string;
};

function getAvailableAddOns(
  itemType: ItemType | null,
  destination: string,
  contents: "documents only" | "goods" | null,
): AddOnConfig[] {
  if (!itemType || !destination) return [];

  const region = getRegion(destination);
  const isParcel = itemType === "parcel";
  const isGoods = contents === "goods";

  const addOns: AddOnConfig[] = [];

  if (isParcel) {
    // Parcels: Tracking is always included
    addOns.push({
      ...ADD_ON_DEFINITIONS.tracking,
      included: true,
      price: 0,
    });

    if (region === "ROI" || region === "NI") {
      // ROI/NI Parcels: Express, Insurance & Signature, Additional Insurance
      addOns.push(ADD_ON_DEFINITIONS.express);
      addOns.push(ADD_ON_DEFINITIONS.insuranceSignature);
      addOns.push(ADD_ON_DEFINITIONS.additionalInsurance);
    } else if (region === "EU" || region === "ROW") {
      // EU/ROW Parcels: Additional Insurance only
      addOns.push(ADD_ON_DEFINITIONS.additionalInsurance);
    } else if (region === "GB") {
      // GB Parcels: Insurance only
      addOns.push(ADD_ON_DEFINITIONS.insurance);
    }
  } else {
    // Non-Parcels (Letter, Large Envelope, Small Packet)
    if (region === "ROI" || region === "NI") {
      // ROI/NI Non-Parcels: Tracking, Insurance & Signature, Additional Insurance
      addOns.push(ADD_ON_DEFINITIONS.tracking);
      addOns.push(ADD_ON_DEFINITIONS.insuranceSignature);
      addOns.push(ADD_ON_DEFINITIONS.additionalInsurance);
    } else if (region === "EU" || region === "ROW") {
      if (isGoods) {
        // EU/ROW Goods: Tracking, Insurance
        addOns.push(ADD_ON_DEFINITIONS.tracking);
        addOns.push(ADD_ON_DEFINITIONS.insurance);
      } else {
        // EU/ROW Documents: Tracking, Insurance & Signature
        addOns.push(ADD_ON_DEFINITIONS.tracking);
        addOns.push(ADD_ON_DEFINITIONS.insuranceSignature);
      }
    } else if (region === "GB") {
      if (isGoods) {
        // GB Goods: Tracking, Insurance, Send as DDP
        addOns.push(ADD_ON_DEFINITIONS.tracking);
        addOns.push(ADD_ON_DEFINITIONS.insurance);
      } else {
        // GB Documents: Tracking, Insurance & Signature, Send as DDP
        addOns.push(ADD_ON_DEFINITIONS.tracking);
        addOns.push(ADD_ON_DEFINITIONS.insuranceSignature);
      }
    }
  }

  return addOns;
}

/* ─────────────────────────────────────────────────────────────
   Reusable Components
───────────────────────────────────────────────────────────── */

function SectionLabel({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <label
      className="block mb-2"
      style={{
        fontFamily: "Inter, sans-serif",
        fontSize: "14px",
        fontWeight: 600,
        color: "#111827",
      }}
    >
      {children}
    </label>
  );
}

function ErrorText({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <p
      style={{
        fontFamily: "Inter, sans-serif",
        fontSize: "13px",
        fontWeight: 500,
        color: "#DC2626",
        marginTop: "8px",
      }}
    >
      {children}
    </p>
  );
}

function formatWeight(weight: number) {
  return weight >= 1
    ? `${weight.toFixed(1)} kg`
    : `${Math.round(weight * 1000)} g`;
}

/* ─────────────────────────────────────────────────────────────
   Service Card Component
───────────────────────────────────────────────────────────── */

interface ServiceCardProps {
  icon: React.ElementType;
  label: string;
  description: string;
  isSelected: boolean;
  onClick: () => void;
  index?: number;
}

function ServiceCard({
  icon: Icon,
  label,
  description,
  isSelected,
  onClick,
  index = 0,
}: ServiceCardProps) {
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
      initial={
        prefersReducedMotion ? {} : { opacity: 0, y: 10 }
      }
      animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
      transition={{
        duration: 0.25,
        delay: index * 0.05,
        ease: easeOut,
      }}
      whileTap={prefersReducedMotion ? {} : { scale: 0.97 }}
      onClick={handleClick}
      className="relative flex flex-col items-center text-center p-4 rounded-xl transition-all overflow-hidden"
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
      <PulseGlow isActive={isSelected} />
      <RippleContainer ripples={ripples} />

      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center mb-2"
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
          fontSize: "14px",
          fontWeight: 600,
          color: "#111827",
        }}
      >
        {label}
      </span>

      <span
        style={{
          fontFamily: "Inter, sans-serif",
          fontSize: "12px",
          fontWeight: 400,
          color: "#6B7280",
          marginTop: "2px",
        }}
      >
        {description}
      </span>

      {/* Selection indicator */}
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
   Pill Button Component (for weight selection)
───────────────────────────────────────────────────────────── */

interface PillButtonProps {
  selected: boolean;
  label: string;
  onClick: () => void;
}

function PillButton({
  selected,
  label,
  onClick,
}: PillButtonProps) {
  const prefersReducedMotion = useReducedMotion();

  const handleClick = () => {
    haptic.light();
    onClick();
  };

  return (
    <motion.button
      whileTap={prefersReducedMotion ? {} : { scale: 0.95 }}
      onClick={handleClick}
      className="relative px-4 py-2.5 rounded-full transition-all overflow-hidden"
      style={{
        backgroundColor: selected ? "#0D6F49" : "#FFFFFF",
        color: selected ? "#FFFFFF" : "#374151",
        border: selected
          ? "2px solid #0D6F49"
          : "2px solid #E5E7EB",
        fontFamily: "Inter, sans-serif",
        fontSize: "14px",
        fontWeight: 600,
      }}
    >
      <ShineEffect isActive={selected} />
      <span className="relative z-10">{label}</span>
    </motion.button>
  );
}

/* ─────────────────────────────────────────────────────────────
   Segmented Button Component (for contents selection)
───────────────────────────────────────────────────────────── */

interface SegmentedButtonProps {
  selected: boolean;
  label: string;
  onClick: () => void;
}

function SegmentedButton({
  selected,
  label,
  onClick,
}: SegmentedButtonProps) {
  const { ripples, createRipple } = useRipple();
  const prefersReducedMotion = useReducedMotion();

  const handleClick = (
    e: React.MouseEvent<HTMLButtonElement>,
  ) => {
    createRipple(e);
    haptic.light();
    onClick();
  };

  return (
    <motion.button
      whileTap={prefersReducedMotion ? {} : { scale: 0.97 }}
      onClick={handleClick}
      className="relative flex-1 px-4 py-3 rounded-xl transition-all overflow-hidden"
      style={{
        backgroundColor: selected ? "#F0FDF4" : "#FFFFFF",
        border: selected
          ? "2px solid #0D6F49"
          : "2px solid #E5E7EB",
        fontFamily: "Inter, sans-serif",
        fontSize: "14px",
        fontWeight: selected ? 600 : 500,
        color: selected ? "#0D6F49" : "#374151",
      }}
    >
      <RippleContainer ripples={ripples} />
      <span className="relative z-10">{label}</span>
    </motion.button>
  );
}

/* ─────────────────────────────────────────────────────────────
   Add-On Card Component
───────────────────────────────────────────────────────────── */

interface AddOnCardProps {
  icon: React.ElementType;
  label: string;
  description: string;
  price: number;
  isSelected: boolean;
  isIncluded?: boolean;
  badge?: string;
  badgeColor?: string;
  onClick: () => void;
}

function AddOnCard({
  icon: Icon,
  label,
  description,
  price,
  isSelected,
  isIncluded,
  badge,
  badgeColor,
  onClick,
}: AddOnCardProps) {
  const { ripples, createRipple } = useRipple();
  const prefersReducedMotion = useReducedMotion();

  const isSelectedState = isSelected;
  const isIncludedState = !!isIncluded;

  const handleClick = (
    e: React.MouseEvent<HTMLButtonElement>,
  ) => {
    if (isIncludedState) return;
    createRipple(e);
    haptic.medium();
    onClick();
  };

  return (
    <motion.button
      whileTap={
        prefersReducedMotion || isIncludedState
          ? {}
          : { scale: 0.98 }
      }
      onClick={handleClick}
      disabled={isIncludedState}
      className="relative w-full flex items-start gap-3 p-4 rounded-xl text-left transition-all"
      style={{
        backgroundColor: isSelectedState
          ? "#F0FDF4"
          : "#FFFFFF",
        border: isSelectedState
          ? "2px solid #0D6F49"
          : "2px solid #E5E7EB",
        boxShadow: isSelectedState
          ? "0 4px 12px rgba(13, 111, 73, 0.08)"
          : "0 1px 2px rgba(0, 0, 0, 0.04)",
        cursor: isIncludedState ? "default" : "pointer",
        opacity: 1,
      }}
    >
      <PulseGlow isActive={isSelectedState} />
      <RippleContainer ripples={ripples} />

      {badge && badgeColor && (
        <FloatingBadge text={badge} color={badgeColor} />
      )}

      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{
          backgroundColor: isSelectedState
            ? "#DCFCE7"
            : "#F3F4F6",
        }}
      >
        <Icon
          className="w-5 h-5"
          style={{
            color: isSelectedState ? "#0D6F49" : "#6B7280",
          }}
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "15px",
              fontWeight: 600,
              color: "#111827",
            }}
          >
            {label}
          </span>
        </div>

        <p
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "13px",
            fontWeight: 400,
            color: "#6B7280",
            marginTop: "2px",
          }}
        >
          {description}
        </p>

        {!isIncludedState && (
          <p
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "14px",
              fontWeight: 600,
              color: "#0D6F49",
              marginTop: "4px",
            }}
          >
            +€{price.toFixed(2)}
          </p>
        )}
      </div>

      <div className="flex-shrink-0 mt-0.5">
        {isIncludedState ? (
          <span
            className="px-2 py-1 rounded-full"
            style={{
              backgroundColor: "#F3F4F6",
              border: "1px solid #E5E7EB",
              fontFamily: "Inter, sans-serif",
              fontSize: "11px",
              fontWeight: 600,
              color: "#6B7280",
            }}
          >
            Included free
          </span>
        ) : (
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center"
            style={{
              backgroundColor: isSelectedState
                ? "#0D6F49"
                : "#FFFFFF",
              border: isSelectedState
                ? "none"
                : "2px solid #D1D5DB",
            }}
          >
            {isSelectedState && <AnimatedCheckmark size={12} />}
          </div>
        )}
      </div>
    </motion.button>
  );
}
/* ─────────────────────────────────────────────────────────────
   Main Component
───────────────────────────────────────────────────────────── */

export const Step1 = () => {
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const {
    data,
    updateData,
    requiresContentsType,
    getValidationErrors,
    isStepValid,
  } = useCheckout();

  const [ctaContainer, setCtaContainer] =
    useState<HTMLElement | null>(null);
  const [showDestinationDropdown, setShowDestinationDropdown] =
    useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [isItemTypeExpanded, setIsItemTypeExpanded] =
    useState(false);

  useEffect(() => {
    setCtaContainer(
      document.getElementById("bottom-cta-container"),
    );
  }, []);

  const errors = getValidationErrors(1);
  const canProceed = isStepValid(1);
  const selectedService = useMemo(
    () => SERVICE_OPTIONS.find((s) => s.type === data.itemType),
    [data.itemType],
  );

  const destinationError = errors.find(
    (e) => e.field === "destination",
  );
  const weightError = errors.find((e) => e.field === "weight");
  const contentsError = errors.find(
    (e) => e.field === "contents",
  );

  const SummaryIcon = selectedService?.icon ?? Package;

  const headerTitle = data.destination
    ? `Sending to ${data.destination}`
    : "Where is your item going?";

  const headerSubtitle = data.destination
    ? "You can change the destination at any time."
    : "Choose the destination first and we’ll show the right delivery options.";

  const isEditingDestination =
    !data.destination || showDestinationDropdown;
  const showItemTypeSelector =
    !!data.destination && !showDestinationDropdown;

  // Get available add-ons based on current selections
  const availableAddOns = useMemo(
    () =>
      getAvailableAddOns(
        data.itemType,
        data.destination,
        data.contents,
      ),
    [data.itemType, data.destination, data.contents],
  );

  // Check if all required fields are filled to show add-ons
  const showAddOns = useMemo(() => {
    if (!data.itemType || !data.destination || !data.weight)
      return false;
    if (requiresContentsType() && !data.contents) return false;
    return true;
  }, [
    data.itemType,
    data.destination,
    data.weight,
    data.contents,
    requiresContentsType,
  ]);

  /* ───────────── Handlers ───────────── */

  const handleItemTypeSelect = (type: ItemType) => {
    haptic.success();
    updateData({
      itemType: type,
      weight: 0,
      contents: null,
      addOns: {
        tracking: false,
        signature: false,
        enhancedCover: false,
        ddp: false,
        express: false,
        insuranceSignature: false,
        insurance: false,
        additionalInsurance: false,
      },
    });
    setShowErrors(false);
    setIsItemTypeExpanded(false);
  };

  const handleDestinationSelect = (destination: string) => {
    haptic.light();
    updateData({
      destination,
      itemType: null,
      weight: 0,
      contents: null,
      addOns: {
        tracking: false,
        signature: false,
        enhancedCover: false,
        ddp: false,
        express: false,
        insuranceSignature: false,
        insurance: false,
        additionalInsurance: false,
      },
    });
    setShowDestinationDropdown(false);
    setShowErrors(false);
    setIsItemTypeExpanded(true);
  };

  const handleWeightSelect = (weight: number) => {
    updateData({ weight });
    setShowErrors(false);
  };

  const handleContentsSelect = (
    contents: "documents only" | "goods",
  ) => {
    haptic.light();
    updateData({
      contents,
      addOns: {
        tracking: false,
        signature: false,
        enhancedCover: false,
        ddp: false,
        express: false,
        insuranceSignature: false,
        insurance: false,
        additionalInsurance: false,
      },
    });
    setShowErrors(false);
  };

  const handleAddOnToggle = (addOnKey: string) => {
    updateData({
      addOns: {
        ...data.addOns,
        [addOnKey]: !data.addOns[addOnKey],
      },
    });
  };

  const handleContinue = () => {
    if (!canProceed) {
      setShowErrors(true);
      return;
    }
    haptic.success();
    navigate("/step2");
  };

  return (
    <div className="py-6 space-y-5">
      {/* Header + Destination */}
      <div className="relative z-50">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1
              className="mb-1"
              style={{
                fontFamily: "Manrope, sans-serif",
                fontSize: "26px",
                fontWeight: 700,
                color: "#111827",
                letterSpacing: "-0.02em",
                lineHeight: "1.3",
              }}
            >
              {headerTitle}
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
              {headerSubtitle}
            </p>
          </div>

          {data.destination && (
            <button
              onClick={() => {
                haptic.light();
                setShowDestinationDropdown(true);
              }}
              className="flex-shrink-0"
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "14px",
                fontWeight: 600,
                color: "#0D6F49",
                background: "transparent",
                border: "none",
                padding: 0,
                cursor: "pointer",
              }}
            >
              Change
            </button>
          )}
        </div>

        <AnimatePresence initial={false} mode="wait">
          {isEditingDestination && (
            <motion.div
              key="destination-editor"
              layout
              initial={
                prefersReducedMotion
                  ? {}
                  : { opacity: 0, y: 8, filter: "blur(4px)" }
              }
              animate={
                prefersReducedMotion
                  ? {}
                  : { opacity: 1, y: 0, filter: "blur(0px)" }
              }
              exit={
                prefersReducedMotion
                  ? {}
                  : { opacity: 0, y: -4, filter: "blur(2px)" }
              }
              transition={{ duration: 0.24, ease: easeOut }}
              className="mt-4 relative z-50"
            >
              {!data.destination && (
                <SectionLabel>Destination</SectionLabel>
              )}

              <div className="relative">
                <button
                  onClick={() => {
                    haptic.light();
                    setShowDestinationDropdown((prev) => !prev);
                  }}
                  className="w-full px-4 py-3.5 rounded-xl text-left flex items-center justify-between transition-all"
                  style={{
                    backgroundColor: "#FFFFFF",
                    border: data.destination
                      ? "2px solid #0D6F49"
                      : "2px solid #E5E7EB",
                    fontFamily: "Inter, sans-serif",
                    fontSize: "15px",
                    fontWeight: data.destination ? 500 : 400,
                    color: data.destination
                      ? "#111827"
                      : "#9CA3AF",
                    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.04)",
                  }}
                >
                  <span className="flex items-center gap-2">
                    {data.destination && (
                      <span className="text-lg">
                        {getFlag(data.destination)}
                      </span>
                    )}
                    {data.destination || "Select destination"}
                  </span>

                  <motion.div
                    animate={
                      prefersReducedMotion
                        ? {}
                        : {
                            rotate: showDestinationDropdown
                              ? 180
                              : 0,
                          }
                    }
                    transition={{
                      duration: 0.2,
                      ease: easeOut,
                    }}
                  >
                    <ChevronDown
                      className="w-5 h-5"
                      style={{ color: "#6B7280" }}
                    />
                  </motion.div>
                </button>

                <AnimatePresence initial={false}>
                  {showDestinationDropdown && (
                    <motion.div
                      initial={
                        prefersReducedMotion
                          ? {}
                          : { opacity: 0, y: -6, scale: 0.985 }
                      }
                      animate={
                        prefersReducedMotion
                          ? {}
                          : { opacity: 1, y: 0, scale: 1 }
                      }
                      exit={
                        prefersReducedMotion
                          ? {}
                          : { opacity: 0, y: -6, scale: 0.985 }
                      }
                      transition={{
                        duration: 0.18,
                        ease: easeOut,
                      }}
                      className="absolute top-full left-0 right-0 mt-2 rounded-xl overflow-hidden shadow-lg z-[100]"
                      style={{
                        backgroundColor: "#FFFFFF",
                        border: "1px solid #E5E7EB",
                      }}
                    >
                      {DESTINATIONS.map(
                        ({ value, flag }, index) => {
                          const isSelected =
                            data.destination === value;
                          return (
                            <button
                              key={value}
                              onClick={() =>
                                handleDestinationSelect(value)
                              }
                              className="w-full px-4 py-3 text-left transition-colors flex items-center justify-between"
                              style={{
                                fontFamily: "Inter, sans-serif",
                                fontSize: "15px",
                                fontWeight: 400,
                                color: "#111827",
                                borderBottom:
                                  index !==
                                  DESTINATIONS.length - 1
                                    ? "1px solid #F3F4F6"
                                    : "none",
                                backgroundColor: isSelected
                                  ? "#F0FDF4"
                                  : "#FFFFFF",
                              }}
                            >
                              <span className="flex items-center gap-2">
                                <span className="text-lg">
                                  {flag}
                                </span>
                                {value}
                              </span>
                              {isSelected && (
                                <Check
                                  className="w-4 h-4"
                                  style={{ color: "#0D6F49" }}
                                />
                              )}
                            </button>
                          );
                        },
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {showErrors && destinationError && (
                <ErrorText>
                  {destinationError.message}
                </ErrorText>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Item Type Selector */}
      {showItemTypeSelector && (
        <motion.div
          layout
          initial={
            prefersReducedMotion ? {} : { opacity: 0, y: 10 }
          }
          animate={
            prefersReducedMotion ? {} : { opacity: 1, y: 0 }
          }
          transition={{
            duration: 0.3,
            delay: 0.12,
            ease: easeOut,
          }}
        >
          <motion.div
            layout
            transition={{
              layout: { duration: 0.28, ease: easeOut },
            }}
            className="overflow-hidden rounded-2xl"
            style={{
              backgroundColor: "#FFFFFF",
              border: "2px solid #E5E7EB",
              boxShadow: "0 1px 2px rgba(0, 0, 0, 0.04)",
            }}
          >
            {/* Collapsed Header */}
            <button
              onClick={() => {
                if (data.itemType) {
                  haptic.light();
                  setIsItemTypeExpanded((prev) => !prev);
                }
              }}
              className="w-full p-4 flex items-center justify-between text-left"
              style={{
                backgroundColor:
                  data.itemType && !isItemTypeExpanded
                    ? "#F0FDF4"
                    : "#FFFFFF",
                cursor: data.itemType ? "pointer" : "default",
              }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{
                    backgroundColor:
                      data.itemType && !isItemTypeExpanded
                        ? "#DCFCE7"
                        : "#F3F4F6",
                  }}
                >
                  <SummaryIcon
                    className="w-5 h-5"
                    style={{
                      color:
                        data.itemType && !isItemTypeExpanded
                          ? "#0D6F49"
                          : "#6B7280",
                    }}
                  />
                </div>

                <div className="min-w-0">
                  <div
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontSize: "15px",
                      fontWeight: 600,
                      color: "#111827",
                    }}
                  >
                    {selectedService
                      ? selectedService.shortLabel
                      : "Choose the item type"}
                  </div>
                  <div
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontSize: "12px",
                      fontWeight: 400,
                      color: "#6B7280",
                      marginTop: "2px",
                    }}
                  >
                    {selectedService
                      ? selectedService.description
                      : "Letter, large envelope, packet or parcel"}
                  </div>
                </div>
              </div>

              <motion.div
                animate={{
                  rotate:
                    isItemTypeExpanded || !data.itemType
                      ? 180
                      : 0,
                }}
                transition={{ duration: 0.22, ease: easeOut }}
                className="flex-shrink-0 ml-3"
              >
                <ChevronDown
                  className="w-5 h-5"
                  style={{ color: "#6B7280" }}
                />
              </motion.div>
            </button>

            {/* Expanded Options */}
            <AnimatePresence initial={false}>
              {(isItemTypeExpanded || !data.itemType) && (
                <motion.div
                  key="item-type-options"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{
                    height: { duration: 0.28, ease: easeOut },
                    opacity: { duration: 0.18 },
                  }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 pt-1 grid grid-cols-2 gap-3">
                    {SERVICE_OPTIONS.map(
                      (
                        { type, icon, label, description },
                        index,
                      ) => (
                        <ServiceCard
                          key={type}
                          icon={icon}
                          label={label}
                          description={description}
                          isSelected={data.itemType === type}
                          onClick={() =>
                            handleItemTypeSelect(type)
                          }
                          index={index}
                        />
                      ),
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}

      {/* Contents */}
      {data.destination &&
        data.itemType &&
        requiresContentsType() && (
          <motion.div
            initial={
              prefersReducedMotion ? {} : { opacity: 0, y: 10 }
            }
            animate={
              prefersReducedMotion ? {} : { opacity: 1, y: 0 }
            }
            transition={{ duration: 0.24, ease: easeOut }}
          >
            <SectionLabel>What&apos;s inside?</SectionLabel>

            <div className="flex gap-2">
              {CONTENTS_OPTIONS.map(({ value, label }) => (
                <SegmentedButton
                  key={value}
                  selected={data.contents === value}
                  label={label}
                  onClick={() => handleContentsSelect(value)}
                />
              ))}
            </div>

            {showErrors && contentsError && (
              <ErrorText>{contentsError.message}</ErrorText>
            )}
          </motion.div>
        )}

      {/* Weight */}
      {selectedService?.weightTiers && data.destination && (
        <motion.div
          initial={
            prefersReducedMotion ? {} : { opacity: 0, y: 10 }
          }
          animate={
            prefersReducedMotion ? {} : { opacity: 1, y: 0 }
          }
          transition={{ duration: 0.24, ease: easeOut }}
        >
          <div className="flex items-center justify-between mb-2">
            <SectionLabel>Weight</SectionLabel>

            {data.weight > 0 && (
              <motion.span
                initial={
                  prefersReducedMotion
                    ? {}
                    : { scale: 0.9, opacity: 0 }
                }
                animate={
                  prefersReducedMotion
                    ? {}
                    : { scale: 1, opacity: 1 }
                }
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 25,
                }}
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#0D6F49",
                }}
              >
                {formatWeight(data.weight)}
              </motion.span>
            )}
          </div>

          <div className="flex gap-2 flex-wrap">
            {selectedService.weightTiers.map((tier) => (
              <PillButton
                key={tier}
                selected={data.weight === tier}
                label={
                  tier >= 1 ? `${tier}kg` : `${tier * 1000}g`
                }
                onClick={() => handleWeightSelect(tier)}
              />
            ))}
          </div>

          {showErrors && weightError && (
            <ErrorText>{weightError.message}</ErrorText>
          )}
        </motion.div>
      )}

      {/* Add-on Services Panel */}
      {showAddOns && availableAddOns.length > 0 && (
        <motion.div
          initial={
            prefersReducedMotion ? {} : { opacity: 0, y: 10 }
          }
          animate={
            prefersReducedMotion ? {} : { opacity: 1, y: 0 }
          }
          transition={{ duration: 0.24, ease: easeOut }}
        >
          <div className="flex items-center justify-between mb-2">
            <SectionLabel>Add extra services</SectionLabel>
            <span
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "12px",
                color: "#6B7280",
              }}
            >
              Optional
            </span>
          </div>

          <div className="space-y-2">
            {availableAddOns.map((addOn, index) => (
              <motion.div
                key={addOn.key}
                initial={
                  prefersReducedMotion
                    ? {}
                    : { opacity: 0, x: -10 }
                }
                animate={
                  prefersReducedMotion
                    ? {}
                    : { opacity: 1, x: 0 }
                }
                transition={{
                  duration: 0.25,
                  delay: index * 0.05,
                  ease: easeOut,
                }}
              >
                <AddOnCard
                  icon={addOn.icon}
                  label={addOn.label}
                  description={addOn.description}
                  price={addOn.price}
                  isSelected={data.addOns[addOn.key] || false}
                  isIncluded={addOn.included}
                  badge={addOn.badge}
                  badgeColor={addOn.badgeColor}
                  onClick={() => handleAddOnToggle(addOn.key)}
                />
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* CTA Button Portal */}
      {ctaContainer &&
        createPortal(
          <motion.button
            onClick={handleContinue}
            disabled={!canProceed}
            whileTap={
              prefersReducedMotion || !canProceed
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
              opacity: canProceed ? 1 : 0.4,
              boxShadow: canProceed
                ? "0 4px 16px rgba(13, 111, 73, 0.24)"
                : "none",
            }}
          >
            Continue
            <motion.div
              animate={
                canProceed && !prefersReducedMotion
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