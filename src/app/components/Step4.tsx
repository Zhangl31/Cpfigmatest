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
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  Edit3,
  Package,
  Mail,
  MapPin,
  FileText,
  Truck,
  Shield,
  ShieldPlus,
  Zap,
  FileCheck,
  Gift,
  Building2,
  RotateCcw,
  Briefcase,
  Sparkles,
  Globe,
  CreditCard,
  Info,
} from "lucide-react";
import {
  motion,
  AnimatePresence,
  useReducedMotion,
} from "motion/react";
import {
  useCheckout,
  type ItemType,
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

const easeOut = [0.22, 1, 0.36, 1] as const;
const DDP_THRESHOLD = 170;

// Item type display config
const ITEM_TYPE_CONFIG: Record<
  ItemType,
  { icon: React.ElementType; label: string }
> = {
  letter: { icon: Mail, label: "Letter" },
  "large-envelope": { icon: Mail, label: "Large Envelope" },
  "small-packet": { icon: Package, label: "Small Packet" },
  parcel: { icon: Package, label: "Parcel" },
};

// Customs type display config
const CUSTOMS_TYPE_CONFIG: Record<
  string,
  { icon: React.ElementType; label: string }
> = {
  documents: { icon: FileText, label: "Documents" },
  sale_of_goods: { icon: Building2, label: "Sale of Goods" },
  gift: { icon: Gift, label: "Gift" },
  returned_goods: { icon: RotateCcw, label: "Returned Goods" },
  commercial_sample: {
    icon: Briefcase,
    label: "Commercial Sample",
  },
};

// Add-on definitions with pricing
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
    description: "Cover up to €100 + signature",
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
    label: "DDP (Prepay Customs)",
    description: "Recipient avoids customs fees",
    price: 4.0,
    icon: FileCheck,
    badge: "NEW",
    badgeColor: "#0D6F49",
  },
};

// Destination config with flags
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

type Region = "ROI" | "NI" | "GB" | "EU" | "ROW";

function getRegion(destination: string): Region {
  const dest = DESTINATIONS.find(
    (d) => d.value === destination,
  );
  return (dest?.region as Region) || "ROW";
}

function getFlag(destination: string): string {
  const dest = DESTINATIONS.find(
    (d) => d.value === destination,
  );
  return dest?.flag || "🌍";
}

/* ─────────────────────────────────────────────────────────────
   Helper: Recipient data
───────────────────────────────────────────────────────────── */

function getEditableRecipientFromData(
  data: ReturnType<typeof useCheckout>["data"],
) {
  if (data.recipient) {
    return {
      fullName:
        data.recipient.fullName ||
        [data.recipient.firstName, data.recipient.lastName]
          .filter(Boolean)
          .join(" "),
      company: data.recipient.company || "",
      email: data.recipient.email || "",
      phonePrefix: data.recipient.phonePrefix || "",
      phoneNumber: data.recipient.phoneNumber || "",
      addressLine1: data.recipient.addressLine1 || "",
      addressLine2: data.recipient.addressLine2 || "",
      addressLine3: data.recipient.addressLine3 || "",
      city: data.recipient.city || "",
      state: data.recipient.state || "",
      postcode: data.recipient.postcode || "",
      country: data.recipient.country || "",
    };
  }

  if (data.selectedContact) {
    return {
      fullName: [
        data.selectedContact.firstName,
        data.selectedContact.lastName,
      ]
        .filter(Boolean)
        .join(" "),
      company: data.selectedContact.company || "",
      email: data.selectedContact.email || "",
      phonePrefix: "",
      phoneNumber: data.selectedContact.phone || "",
      addressLine1: data.selectedContact.addressLine1 || "",
      addressLine2: data.selectedContact.addressLine2 || "",
      addressLine3: data.selectedContact.addressLine3 || "",
      city: data.selectedContact.city || "",
      state: data.selectedContact.state || "",
      postcode: data.selectedContact.postcode || "",
      country: data.selectedContact.country || "",
    };
  }

  return null;
}

function getRecipientSummary(
  data: ReturnType<typeof useCheckout>["data"],
) {
  const recipient = getEditableRecipientFromData(data);
  if (!recipient) return null;

  const lines = [
    recipient.addressLine1,
    recipient.addressLine2,
    recipient.addressLine3,
    recipient.city,
    recipient.state,
    recipient.postcode,
    recipient.country,
  ].filter(Boolean);

  return {
    fullName: recipient.fullName || "",
    email: recipient.email || "",
    phone:
      [recipient.phonePrefix, recipient.phoneNumber]
        .filter(Boolean)
        .join(" ")
        .trim() || "",
    lines,
  };
}

/* ─────────────────────────────────────────────────────────────
   Helper: Get available add-ons based on selections
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
    addOns.push({
      ...ADD_ON_DEFINITIONS.tracking,
      included: true,
      price: 0,
    });

    if (region === "ROI" || region === "NI") {
      addOns.push(ADD_ON_DEFINITIONS.express);
      addOns.push(ADD_ON_DEFINITIONS.insuranceSignature);
      addOns.push(ADD_ON_DEFINITIONS.additionalInsurance);
    } else if (region === "EU" || region === "ROW") {
      addOns.push(ADD_ON_DEFINITIONS.additionalInsurance);
    } else if (region === "GB") {
      addOns.push(ADD_ON_DEFINITIONS.insurance);
      addOns.push(ADD_ON_DEFINITIONS.ddp);
    }
  } else {
    if (region === "ROI" || region === "NI") {
      addOns.push(ADD_ON_DEFINITIONS.tracking);
      addOns.push(ADD_ON_DEFINITIONS.insuranceSignature);
      addOns.push(ADD_ON_DEFINITIONS.additionalInsurance);
    } else if (region === "EU" || region === "ROW") {
      if (isGoods) {
        addOns.push(ADD_ON_DEFINITIONS.tracking);
        addOns.push(ADD_ON_DEFINITIONS.insurance);
      } else {
        addOns.push(ADD_ON_DEFINITIONS.tracking);
        addOns.push(ADD_ON_DEFINITIONS.insuranceSignature);
      }
    } else if (region === "GB") {
      if (isGoods) {
        addOns.push(ADD_ON_DEFINITIONS.tracking);
        addOns.push(ADD_ON_DEFINITIONS.insurance);
        addOns.push(ADD_ON_DEFINITIONS.ddp);
      } else {
        addOns.push(ADD_ON_DEFINITIONS.tracking);
        addOns.push(ADD_ON_DEFINITIONS.insuranceSignature);
        addOns.push(ADD_ON_DEFINITIONS.ddp);
      }
    }
  }

  return addOns;
}

/* ─────────────────────────────────────────────────────────────
   Helper: Calculate pricing
───────────────────────────────────────────────────────────── */

function getBasePrice(
  itemType: ItemType | null,
  weight: number,
  destination: string,
): number {
  if (!itemType || !weight || !destination) return 0;

  const region = getRegion(destination);
  let basePrice = 0;

  switch (itemType) {
    case "letter":
      basePrice =
        region === "ROI" || region === "NI"
          ? 1.35
          : region === "EU"
            ? 2.2
            : 3.5;
      break;
    case "large-envelope":
      basePrice =
        region === "ROI" || region === "NI"
          ? 2.5
          : region === "EU"
            ? 4.0
            : 6.5;
      if (weight > 0.25) basePrice += 1.5;
      break;
    case "small-packet":
      basePrice =
        region === "ROI" || region === "NI"
          ? 4.5
          : region === "EU"
            ? 8.0
            : 12.0;
      if (weight > 0.5) basePrice += 3.0;
      if (weight > 1) basePrice += 4.0;
      break;
    case "parcel":
      basePrice =
        region === "ROI" || region === "NI"
          ? 8.5
          : region === "EU"
            ? 15.0
            : 25.0;
      if (weight > 5) basePrice += 5.0;
      if (weight > 10) basePrice += 8.0;
      if (weight > 15) basePrice += 10.0;
      break;
  }

  return basePrice;
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
   Animated Checkmark
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
   Floating Badge
───────────────────────────────────────────────────────────── */

function FloatingBadge({
  text,
  color,
}: {
  text: string;
  color: string;
}) {
  return (
    <span
      style={{
        backgroundColor: color,
        color: "#FFFFFF",
        fontSize: "9px",
        fontWeight: 700,
        fontFamily: "Inter, sans-serif",
        padding: "2px 5px",
        borderRadius: "4px",
        marginLeft: "6px",
        letterSpacing: "0.02em",
      }}
    >
      {text}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────
   Review Section Card Component
───────────────────────────────────────────────────────────── */

interface ReviewSectionProps {
  title: string;
  icon: React.ElementType;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  summaryContent?: React.ReactNode;
}

function ReviewSection({
  title,
  icon: Icon,
  isExpanded,
  onToggle,
  children,
  summaryContent,
}: ReviewSectionProps) {
  return (
    <motion.div
      layout
      transition={{ layout: { duration: 0.25, ease: easeOut } }}
      className="rounded-2xl overflow-hidden"
      style={{
        backgroundColor: "#FFFFFF",
        border: isExpanded
          ? "2px solid #0D6F49"
          : "2px solid #E5E7EB",
        boxShadow: isExpanded
          ? "0 4px 12px rgba(13, 111, 73, 0.1)"
          : "0 1px 3px rgba(0, 0, 0, 0.05)",
      }}
    >
      <button
        onClick={() => {
          haptic.light();
          onToggle();
        }}
        className="w-full p-4 flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{
              backgroundColor: isExpanded
                ? "#DCFCE7"
                : "#F3F4F6",
            }}
          >
            <Icon
              className="w-5 h-5"
              style={{
                color: isExpanded ? "#0D6F49" : "#6B7280",
              }}
            />
          </div>
          <div>
            <h3
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "15px",
                fontWeight: 600,
                color: "#111827",
              }}
            >
              {title}
            </h3>
            {!isExpanded && summaryContent && (
              <div
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "13px",
                  fontWeight: 400,
                  color: "#6B7280",
                  marginTop: "2px",
                }}
              >
                {summaryContent}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isExpanded && (
            <span
              className="flex items-center gap-1 px-2 py-1 rounded-lg"
              style={{
                backgroundColor: "#F0FDF4",
                fontFamily: "Inter, sans-serif",
                fontSize: "12px",
                fontWeight: 600,
                color: "#0D6F49",
              }}
            >
              <Edit3 className="w-3 h-3" />
              Edit
            </span>
          )}
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown
              className="w-5 h-5"
              style={{ color: "#6B7280" }}
            />
          </motion.div>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{
              height: { duration: 0.25, ease: easeOut },
              opacity: { duration: 0.15 },
            }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Add-On Toggle Item
───────────────────────────────────────────────────────────── */

interface AddOnToggleProps {
  addOn: AddOnConfig;
  isSelected: boolean;
  onToggle: () => void;
}

function AddOnToggle({
  addOn,
  isSelected,
  onToggle,
}: AddOnToggleProps) {
  const { ripples, createRipple } = useRipple();
  const prefersReducedMotion = useReducedMotion();
  const isActive = isSelected || addOn.included;
  const Icon = addOn.icon;

  const handleClick = (
    e: React.MouseEvent<HTMLButtonElement>,
  ) => {
    if (addOn.included) return;
    createRipple(e);
    haptic.medium();
    onToggle();
  };

  return (
    <motion.button
      whileTap={
        prefersReducedMotion || addOn.included
          ? {}
          : { scale: 0.98 }
      }
      onClick={handleClick}
      disabled={addOn.included}
      className="relative w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all overflow-hidden"
      style={{
        backgroundColor: isActive ? "#F0FDF4" : "#F9FAFB",
        border: isActive
          ? "2px solid #0D6F49"
          : "2px solid transparent",
        cursor: addOn.included ? "default" : "pointer",
      }}
    >
      <RippleContainer ripples={ripples} />

      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{
          backgroundColor: isActive ? "#DCFCE7" : "#E5E7EB",
        }}
      >
        <Icon
          className="w-4 h-4"
          style={{ color: isActive ? "#0D6F49" : "#6B7280" }}
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center">
          <span
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "14px",
              fontWeight: 600,
              color: "#111827",
            }}
          >
            {addOn.label}
          </span>
          {addOn.badge && addOn.badgeColor && (
            <FloatingBadge
              text={addOn.badge}
              color={addOn.badgeColor}
            />
          )}
        </div>
        <p
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "12px",
            fontWeight: 400,
            color: "#6B7280",
          }}
        >
          {addOn.description}
        </p>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {addOn.included ? (
          <span
            className="flex items-center gap-1 px-2 py-1 rounded-full"
            style={{
              backgroundColor: "#DCFCE7",
              fontFamily: "Inter, sans-serif",
              fontSize: "11px",
              fontWeight: 600,
              color: "#0D6F49",
            }}
          >
            <Sparkles className="w-3 h-3" />
            Included
          </span>
        ) : (
          <>
            <span
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "14px",
                fontWeight: 600,
                color: isActive ? "#0D6F49" : "#6B7280",
              }}
            >
              +€{addOn.price.toFixed(2)}
            </span>
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center"
              style={{
                backgroundColor: isActive
                  ? "#0D6F49"
                  : "#FFFFFF",
                border: isActive ? "none" : "2px solid #D1D5DB",
              }}
            >
              {isActive && <AnimatedCheckmark size={12} />}
            </div>
          </>
        )}
      </div>
    </motion.button>
  );
}

/* ─────────────────────────────────────────────────────────────
   DDP Recommendation Banner
───────────────────────────────────────────────────────────── */

interface DdpBannerProps {
  onAddDdp: () => void;
}

function DdpRecommendationBanner({ onAddDdp }: DdpBannerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-3 rounded-xl flex items-center gap-3"
      style={{
        backgroundColor: "#FEF3C7",
        border: "1px solid #FDE68A",
      }}
    >
      <Info
        className="w-5 h-5 flex-shrink-0"
        style={{ color: "#D97706" }}
      />
      <p
        className="flex-1"
        style={{
          fontFamily: "Inter, sans-serif",
          fontSize: "13px",
          fontWeight: 500,
          color: "#92400E",
        }}
      >
        Value over €170 to UK — consider DDP
      </p>
      <button
        onClick={() => {
          haptic.success();
          onAddDdp();
        }}
        className="px-3 py-1.5 rounded-lg"
        style={{
          backgroundColor: "#D97706",
          color: "#FFFFFF",
          fontFamily: "Inter, sans-serif",
          fontSize: "12px",
          fontWeight: 600,
        }}
      >
        Add +€4
      </button>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Price Summary Component
───────────────────────────────────────────────────────────── */

interface PriceSummaryProps {
  basePrice: number;
  addOnsPrice: number;
  total: number;
}

function PriceSummary({
  basePrice,
  addOnsPrice,
  total,
}: PriceSummaryProps) {
  return (
    <div
      className="p-4 rounded-2xl"
      style={{
        backgroundColor: "#F9FAFB",
        border: "1px solid #E5E7EB",
      }}
    >
      <div className="space-y-2">
        <div className="flex justify-between">
          <span
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "14px",
              color: "#6B7280",
            }}
          >
            Postage
          </span>
          <span
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "14px",
              fontWeight: 500,
              color: "#111827",
            }}
          >
            €{basePrice.toFixed(2)}
          </span>
        </div>

        {addOnsPrice > 0 && (
          <div className="flex justify-between">
            <span
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "14px",
                color: "#6B7280",
              }}
            >
              Extra services
            </span>
            <span
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "14px",
                fontWeight: 500,
                color: "#111827",
              }}
            >
              €{addOnsPrice.toFixed(2)}
            </span>
          </div>
        )}

        <div
          className="pt-2 mt-2 flex justify-between"
          style={{ borderTop: "1px solid #E5E7EB" }}
        >
          <span
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "16px",
              fontWeight: 600,
              color: "#111827",
            }}
          >
            Total
          </span>
          <span
            style={{
              fontFamily: "Manrope, sans-serif",
              fontSize: "20px",
              fontWeight: 700,
              color: "#0D6F49",
            }}
          >
            €{total.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Main Component
───────────────────────────────────────────────────────────── */

export const Step3Review = () => {
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const { data, updateData } = useCheckout();

  const [ctaContainer, setCtaContainer] =
    useState<HTMLElement | null>(null);
  const [expandedSection, setExpandedSection] = useState<
    string | null
  >(null);

  useEffect(() => {
    setCtaContainer(
      document.getElementById("bottom-cta-container"),
    );
  });

  const availableAddOns = useMemo(
    () =>
      getAvailableAddOns(
        data.itemType,
        data.destination,
        data.contents,
      ),
    [data.itemType, data.destination, data.contents],
  );

  const basePrice = useMemo(
    () =>
      getBasePrice(
        data.itemType,
        data.weight,
        data.destination,
      ),
    [data.itemType, data.weight, data.destination],
  );

  const addOnsPrice = useMemo(() => {
    return availableAddOns.reduce((total, addOn) => {
      if (addOn.included) return total;
      if (
        data.addOns[
          addOn.key as keyof typeof data.addOns
        ]
      ) {
        return total + addOn.price;
      }
      return total;
    }, 0);
  }, [availableAddOns, data.addOns]);

  const totalPrice = basePrice + addOnsPrice;

  const region = getRegion(data.destination);
  const showDdpRecommendation =
    region === "GB" &&
    data.declaredValue > DDP_THRESHOLD &&
    !data.addOns.ddp;

  const selectedAddOnsSummary = useMemo(() => {
    const selected = availableAddOns.filter(
      (addOn) =>
        data.addOns[
          addOn.key as keyof typeof data.addOns
        ] || addOn.included,
    );
    if (selected.length === 0) return "No extras selected";
    return selected.map((a) => a.label).join(", ");
  }, [availableAddOns, data.addOns]);

  const recipientSummary = useMemo(
    () => getRecipientSummary(data),
    [data],
  );

  const handleToggleSection = (section: string) => {
    setExpandedSection(
      expandedSection === section ? null : section,
    );
  };

  const handleAddOnToggle = (addOnKey: string) => {
    updateData({
      addOns: {
        ...data.addOns,
        [addOnKey]:
          !data.addOns[
            addOnKey as keyof typeof data.addOns
          ],
      },
    });
  };

  const handleAddDdp = () => {
    updateData({
      addOns: {
        ...data.addOns,
        ddp: true,
      },
    });
  };

  const handlePay = () => {
    haptic.success();
    navigate("/confirmation");
  };

  const handleRecipientFieldChange = (
    field:
      | "fullName"
      | "company"
      | "email"
      | "phonePrefix"
      | "phoneNumber"
      | "addressLine1"
      | "addressLine2"
      | "addressLine3"
      | "city"
      | "state"
      | "postcode"
      | "country",
    value: string,
  ) => {
    const base =
      getEditableRecipientFromData(data) || {
        fullName: "",
        company: "",
        email: "",
        phonePrefix: "",
        phoneNumber: "",
        addressLine1: "",
        addressLine2: "",
        addressLine3: "",
        city: "",
        state: "",
        postcode: "",
        country: data.destination || "",
      };

    updateData({
      selectedContact: null,
      recipient: {
        ...data.recipient,
        ...base,
        [field]: value,
      },
    });
  };

  const formatWeight = (weight: number) =>
    weight >= 1 ? `${weight}kg` : `${weight * 1000}g`;

  const itemTypeConfig = data.itemType
    ? ITEM_TYPE_CONFIG[data.itemType]
    : null;
  const ItemIcon = itemTypeConfig?.icon || Package;

  const customsTypeConfig = data.customsType
    ? CUSTOMS_TYPE_CONFIG[data.customsType]
    : null;

  const hasCustomsInfo =
    region !== "ROI" &&
    region !== "NI" &&
    (data.itemDescription || data.declaredValue);

  const editableRecipient = getEditableRecipientFromData(data);

  return (
    <div className="py-6 space-y-5">
      {/* Back Button */}
      <button
        onClick={() => navigate("/step3")}
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
          Review & Pay
        </h1>
        <p
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "14px",
            fontWeight: 400,
            color: "#6B7280",
          }}
        >
          Check your details and make changes if needed
        </p>
      </div>

      {/* Shipment Details Section */}
      <ReviewSection
        title="Shipment Details"
        icon={ItemIcon}
        isExpanded={expandedSection === "shipment"}
        onToggle={() => handleToggleSection("shipment")}
        summaryContent={
          <span>
            {itemTypeConfig?.label} •{" "}
            {formatWeight(data.weight)} •{" "}
            {getFlag(data.destination)} {data.destination}
          </span>
        }
      >
        <div className="space-y-4">
          <div>
            <label
              className="block mb-2"
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "12px",
                fontWeight: 600,
                color: "#6B7280",
              }}
            >
              Item Type
            </label>
            <div
              className="flex items-center gap-3 p-3 rounded-xl"
              style={{ backgroundColor: "#F9FAFB" }}
            >
              <ItemIcon
                className="w-5 h-5"
                style={{ color: "#0D6F49" }}
              />
              <span
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "15px",
                  fontWeight: 500,
                  color: "#111827",
                }}
              >
                {itemTypeConfig?.label}
              </span>
            </div>
          </div>

          <div>
            <label
              className="block mb-2"
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "12px",
                fontWeight: 600,
                color: "#6B7280",
              }}
            >
              Destination
            </label>
            <div
              className="flex items-center gap-3 p-3 rounded-xl"
              style={{ backgroundColor: "#F9FAFB" }}
            >
              <span className="text-xl">
                {getFlag(data.destination)}
              </span>
              <span
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "15px",
                  fontWeight: 500,
                  color: "#111827",
                }}
              >
                {data.destination}
              </span>
            </div>
          </div>

          <div>
            <label
              className="block mb-2"
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "12px",
                fontWeight: 600,
                color: "#6B7280",
              }}
            >
              Weight
            </label>
            <div
              className="p-3 rounded-xl"
              style={{ backgroundColor: "#F9FAFB" }}
            >
              <span
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "15px",
                  fontWeight: 500,
                  color: "#111827",
                }}
              >
                {formatWeight(data.weight)}
              </span>
            </div>
          </div>

          <button
            onClick={() => navigate("/step1")}
            className="flex items-center gap-2 mt-2"
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "14px",
              fontWeight: 600,
              color: "#0D6F49",
            }}
          >
            <Edit3 className="w-4 h-4" />
            Change shipment details
          </button>
        </div>
      </ReviewSection>

      {/* Recipient Address Section */}
      {recipientSummary && editableRecipient && (
        <ReviewSection
          title="Recipient Address"
          icon={MapPin}
          isExpanded={expandedSection === "recipient"}
          onToggle={() => handleToggleSection("recipient")}
          summaryContent={
            <span>
              {recipientSummary.fullName} •{" "}
              {recipientSummary.lines[0]}
            </span>
          }
        >
          <div className="space-y-4">
            <div>
              <label
                className="block mb-2"
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#6B7280",
                }}
              >
                Full Name
              </label>
              <input
                type="text"
                value={editableRecipient.fullName}
                onChange={(e) =>
                  handleRecipientFieldChange(
                    "fullName",
                    e.target.value,
                  )
                }
                className="w-full px-4 py-3 rounded-xl"
                style={{
                  backgroundColor: "#F9FAFB",
                  border: "1px solid #E5E7EB",
                  fontFamily: "Inter, sans-serif",
                  fontSize: "15px",
                  color: "#111827",
                }}
              />
            </div>

            <div>
              <label
                className="block mb-2"
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#6B7280",
                }}
              >
                Company
              </label>
              <input
                type="text"
                value={editableRecipient.company}
                onChange={(e) =>
                  handleRecipientFieldChange(
                    "company",
                    e.target.value,
                  )
                }
                className="w-full px-4 py-3 rounded-xl"
                style={{
                  backgroundColor: "#F9FAFB",
                  border: "1px solid #E5E7EB",
                  fontFamily: "Inter, sans-serif",
                  fontSize: "15px",
                  color: "#111827",
                }}
              />
            </div>

            <div>
              <label
                className="block mb-2"
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#6B7280",
                }}
              >
                Email
              </label>
              <input
                type="email"
                value={editableRecipient.email}
                onChange={(e) =>
                  handleRecipientFieldChange(
                    "email",
                    e.target.value,
                  )
                }
                className="w-full px-4 py-3 rounded-xl"
                style={{
                  backgroundColor: "#F9FAFB",
                  border: "1px solid #E5E7EB",
                  fontFamily: "Inter, sans-serif",
                  fontSize: "15px",
                  color: "#111827",
                }}
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label
                  className="block mb-2"
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#6B7280",
                  }}
                >
                  Prefix
                </label>
                <input
                  type="text"
                  value={editableRecipient.phonePrefix}
                  onChange={(e) =>
                    handleRecipientFieldChange(
                      "phonePrefix",
                      e.target.value,
                    )
                  }
                  className="w-full px-4 py-3 rounded-xl"
                  style={{
                    backgroundColor: "#F9FAFB",
                    border: "1px solid #E5E7EB",
                    fontFamily: "Inter, sans-serif",
                    fontSize: "15px",
                    color: "#111827",
                  }}
                />
              </div>

              <div className="col-span-2">
                <label
                  className="block mb-2"
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#6B7280",
                  }}
                >
                  Phone
                </label>
                <input
                  type="text"
                  value={editableRecipient.phoneNumber}
                  onChange={(e) =>
                    handleRecipientFieldChange(
                      "phoneNumber",
                      e.target.value,
                    )
                  }
                  className="w-full px-4 py-3 rounded-xl"
                  style={{
                    backgroundColor: "#F9FAFB",
                    border: "1px solid #E5E7EB",
                    fontFamily: "Inter, sans-serif",
                    fontSize: "15px",
                    color: "#111827",
                  }}
                />
              </div>
            </div>

            <div>
              <label
                className="block mb-2"
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#6B7280",
                }}
              >
                Address Line 1
              </label>
              <input
                type="text"
                value={editableRecipient.addressLine1}
                onChange={(e) =>
                  handleRecipientFieldChange(
                    "addressLine1",
                    e.target.value,
                  )
                }
                className="w-full px-4 py-3 rounded-xl"
                style={{
                  backgroundColor: "#F9FAFB",
                  border: "1px solid #E5E7EB",
                  fontFamily: "Inter, sans-serif",
                  fontSize: "15px",
                  color: "#111827",
                }}
              />
            </div>

            <div>
              <label
                className="block mb-2"
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#6B7280",
                }}
              >
                Address Line 2
              </label>
              <input
                type="text"
                value={editableRecipient.addressLine2}
                onChange={(e) =>
                  handleRecipientFieldChange(
                    "addressLine2",
                    e.target.value,
                  )
                }
                className="w-full px-4 py-3 rounded-xl"
                style={{
                  backgroundColor: "#F9FAFB",
                  border: "1px solid #E5E7EB",
                  fontFamily: "Inter, sans-serif",
                  fontSize: "15px",
                  color: "#111827",
                }}
              />
            </div>

            <div>
              <label
                className="block mb-2"
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#6B7280",
                }}
              >
                Address Line 3
              </label>
              <input
                type="text"
                value={editableRecipient.addressLine3}
                onChange={(e) =>
                  handleRecipientFieldChange(
                    "addressLine3",
                    e.target.value,
                  )
                }
                className="w-full px-4 py-3 rounded-xl"
                style={{
                  backgroundColor: "#F9FAFB",
                  border: "1px solid #E5E7EB",
                  fontFamily: "Inter, sans-serif",
                  fontSize: "15px",
                  color: "#111827",
                }}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  className="block mb-2"
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#6B7280",
                  }}
                >
                  City
                </label>
                <input
                  type="text"
                  value={editableRecipient.city}
                  onChange={(e) =>
                    handleRecipientFieldChange(
                      "city",
                      e.target.value,
                    )
                  }
                  className="w-full px-4 py-3 rounded-xl"
                  style={{
                    backgroundColor: "#F9FAFB",
                    border: "1px solid #E5E7EB",
                    fontFamily: "Inter, sans-serif",
                    fontSize: "15px",
                    color: "#111827",
                  }}
                />
              </div>

              <div>
                <label
                  className="block mb-2"
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#6B7280",
                  }}
                >
                  State/County
                </label>
                <input
                  type="text"
                  value={editableRecipient.state}
                  onChange={(e) =>
                    handleRecipientFieldChange(
                      "state",
                      e.target.value,
                    )
                  }
                  className="w-full px-4 py-3 rounded-xl"
                  style={{
                    backgroundColor: "#F9FAFB",
                    border: "1px solid #E5E7EB",
                    fontFamily: "Inter, sans-serif",
                    fontSize: "15px",
                    color: "#111827",
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  className="block mb-2"
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#6B7280",
                  }}
                >
                  Postcode
                </label>
                <input
                  type="text"
                  value={editableRecipient.postcode}
                  onChange={(e) =>
                    handleRecipientFieldChange(
                      "postcode",
                      e.target.value,
                    )
                  }
                  className="w-full px-4 py-3 rounded-xl"
                  style={{
                    backgroundColor: "#F9FAFB",
                    border: "1px solid #E5E7EB",
                    fontFamily: "Inter, sans-serif",
                    fontSize: "15px",
                    color: "#111827",
                  }}
                />
              </div>

              <div>
                <label
                  className="block mb-2"
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#6B7280",
                  }}
                >
                  Country
                </label>
                <input
                  type="text"
                  value={editableRecipient.country}
                  onChange={(e) =>
                    handleRecipientFieldChange(
                      "country",
                      e.target.value,
                    )
                  }
                  className="w-full px-4 py-3 rounded-xl"
                  style={{
                    backgroundColor: "#F9FAFB",
                    border: "1px solid #E5E7EB",
                    fontFamily: "Inter, sans-serif",
                    fontSize: "15px",
                    color: "#111827",
                  }}
                />
              </div>
            </div>

            <button
              onClick={() => navigate("/step3")}
              className="flex items-center gap-2 mt-2"
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "14px",
                fontWeight: 600,
                color: "#0D6F49",
              }}
            >
              <Edit3 className="w-4 h-4" />
              Open full recipient screen
            </button>
          </div>
        </ReviewSection>
      )}

      {/* Customs Information Section (if applicable) */}
      {hasCustomsInfo && (
        <ReviewSection
          title="Customs Information"
          icon={Globe}
          isExpanded={expandedSection === "customs"}
          onToggle={() => handleToggleSection("customs")}
          summaryContent={
            <span>
              {customsTypeConfig?.label} • €
              {data.declaredValue?.toFixed(2)}
            </span>
          }
        >
          <div className="space-y-4">
            <div>
              <label
                className="block mb-2"
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#6B7280",
                }}
              >
                Shipment Type
              </label>
              <div
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{ backgroundColor: "#F9FAFB" }}
              >
                {customsTypeConfig && (
                  <customsTypeConfig.icon
                    className="w-5 h-5"
                    style={{ color: "#0D6F49" }}
                  />
                )}
                <span
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "15px",
                    fontWeight: 500,
                    color: "#111827",
                  }}
                >
                  {customsTypeConfig?.label}
                </span>
              </div>
            </div>

            {data.itemDescription && (
              <div>
                <label
                  className="block mb-2"
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#6B7280",
                  }}
                >
                  Description
                </label>
                <div
                  className="p-3 rounded-xl"
                  style={{ backgroundColor: "#F9FAFB" }}
                >
                  <span
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontSize: "15px",
                      fontWeight: 400,
                      color: "#111827",
                    }}
                  >
                    {data.itemDescription}
                  </span>
                </div>
              </div>
            )}

            <div>
              <label
                className="block mb-2"
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#6B7280",
                }}
              >
                Declared Value
              </label>
              <div
                className="p-3 rounded-xl"
                style={{ backgroundColor: "#F9FAFB" }}
              >
                <span
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "15px",
                    fontWeight: 600,
                    color: "#111827",
                  }}
                >
                  €{data.declaredValue?.toFixed(2)}
                </span>
              </div>
            </div>

            {data.taricCode && (
              <div>
                <label
                  className="block mb-2"
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#6B7280",
                  }}
                >
                  Customs Code
                </label>
                <div
                  className="p-3 rounded-xl"
                  style={{ backgroundColor: "#F9FAFB" }}
                >
                  <span
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontSize: "15px",
                      fontWeight: 500,
                      color: "#0D6F49",
                    }}
                  >
                    {data.taricCode}
                  </span>
                </div>
              </div>
            )}

            <button
              onClick={() => navigate("/step2")}
              className="flex items-center gap-2 mt-2"
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "14px",
                fontWeight: 600,
                color: "#0D6F49",
              }}
            >
              <Edit3 className="w-4 h-4" />
              Change customs information
            </button>
          </div>
        </ReviewSection>
      )}

      {/* Extra Services Section */}
      <ReviewSection
        title="Extra Services"
        icon={Sparkles}
        isExpanded={expandedSection === "addons"}
        onToggle={() => handleToggleSection("addons")}
        summaryContent={selectedAddOnsSummary}
      >
        <div className="space-y-3">
          <AnimatePresence>
            {showDdpRecommendation && (
              <DdpRecommendationBanner
                onAddDdp={handleAddDdp}
              />
            )}
          </AnimatePresence>

          {availableAddOns.map((addOn) => (
            <AddOnToggle
              key={addOn.key}
              addOn={addOn}
              isSelected={
                data.addOns[
                  addOn.key as keyof typeof data.addOns
                ] || false
              }
              onToggle={() => handleAddOnToggle(addOn.key)}
            />
          ))}

          {availableAddOns.length === 0 && (
            <p
              className="text-center py-4"
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "14px",
                color: "#6B7280",
              }}
            >
              No extra services available for this shipment
            </p>
          )}
        </div>
      </ReviewSection>

      {/* Price Summary */}
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
        <PriceSummary
          basePrice={basePrice}
          addOnsPrice={addOnsPrice}
          total={totalPrice}
        />
      </motion.div>

      {/* CTA Button Portal */}
      {ctaContainer &&
        createPortal(
          <motion.button
            onClick={handlePay}
            whileTap={
              prefersReducedMotion ? {} : { scale: 0.97 }
            }
            className="px-7 py-3.5 rounded-xl transition-all flex items-center gap-2"
            style={{
              backgroundColor: "#0D6F49",
              color: "#FFFFFF",
              fontFamily: "Inter, sans-serif",
              fontSize: "15px",
              fontWeight: 600,
              boxShadow: "0 4px 16px rgba(13, 111, 73, 0.24)",
            }}
          >
            <CreditCard className="w-4 h-4" />
            Pay €{totalPrice.toFixed(2)}
            <motion.div
              animate={
                !prefersReducedMotion ? { x: [0, 4, 0] } : {}
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

export const Step4 = Step3Review;
export default Step3Review;