import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  ReactNode,
} from "react";

export type ItemType =
  | "letter"
  | "large-envelope"
  | "small-packet"
  | "parcel";

export type Region = "ROI" | "NI" | "GB" | "EU" | "ROW";

export type CustomsType =
  | "documents"
  | "sale_of_goods"
  | "gift"
  | "returned_goods"
  | "commercial_sample";

export interface AddOns {
  tracking: boolean;
  express: boolean;
  insuranceSignature: boolean;
  insurance: boolean;
  additionalInsurance: boolean;
  ddp: boolean;
}

export interface RecipientData {
  firstName?: string;
  lastName?: string;
  fullName?: string;
  company?: string;
  email?: string;
  countryCode?: string;
  phonePrefix?: string;
  phoneNumber?: string;
  addressLine1: string;
  addressLine2?: string;
  addressLine3?: string;
  city: string;
  state?: string;
  postcode: string;
  country: string;
  saveToAddressBook?: boolean;
}

export interface SavedContact {
  id: string;
  firstName: string;
  lastName: string;
  company?: string;
  email?: string;
  phone?: string;
  addressLine1: string;
  addressLine2?: string;
  addressLine3?: string;
  city: string;
  state?: string;
  postcode: string;
  country: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface CheckoutData {
  // Step 1
  itemType: ItemType | null;
  weight: number;
  destination: string;
  contents: "documents only" | "goods" | null;
  addOns: AddOns;

  // Step 2
  customsType: CustomsType | null;
  itemDescription: string;
  declaredValue: number;
  taricCode: string;

  // Step 3
  selectedContact: SavedContact | null;
  recipient: RecipientData | null;
}

interface CheckoutContextType {
  data: CheckoutData;
  updateData: (updates: Partial<CheckoutData>) => void;
  getBasePrice: () => number;
  getAddOnPrice: () => number;
  getTotalPrice: () => number;
  requiresContentsType: () => boolean;
  getValidationErrors: (step: number) => ValidationError[];
  isStepValid: (step: number) => boolean;
  resetCheckout: () => void;
}

const CheckoutContext = createContext<
  CheckoutContextType | undefined
>(undefined);

const EMPTY_ADD_ONS: AddOns = {
  tracking: false,
  express: false,
  insuranceSignature: false,
  insurance: false,
  additionalInsurance: false,
  ddp: false,
};

const initialData: CheckoutData = {
  itemType: null,
  weight: 0,
  destination: "",
  contents: null,
  addOns: EMPTY_ADD_ONS,
  customsType: null,
  itemDescription: "",
  declaredValue: 0,
  taricCode: "",
  selectedContact: null,
  recipient: null,
};

export const SAVED_CONTACTS: SavedContact[] = [
  {
    id: "1",
    firstName: "Aoife",
    lastName: "Murphy",
    email: "aoife@example.com",
    addressLine1: "12 Main Street",
    city: "Dublin",
    postcode: "D02 XY76",
    country: "Ireland",
  },
  {
    id: "2",
    firstName: "Max",
    lastName: "Schneider",
    company: "Schneider Studio",
    email: "max@example.com",
    addressLine1: "48 Lindenstraße",
    city: "Berlin",
    postcode: "10115",
    country: "Germany",
  },
];

function getRegion(destination: string): Region {
  const destinations: Record<string, Region> = {
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

  return destinations[destination] || "ROW";
}

function requiresTaricCode(
  destination: string,
  customsType: CustomsType | null,
): boolean {
  const region = getRegion(destination);
  const isDocument = customsType === "documents";

  if (isDocument) return false;
  if (region === "ROI" || region === "NI" || region === "EU") {
    return false;
  }

  return true;
}

export const CheckoutProvider: React.FC<{
  children: ReactNode;
}> = ({ children }) => {
  const [data, setData] = useState<CheckoutData>(initialData);

  const updateData = (updates: Partial<CheckoutData>) => {
    setData((prev) => ({
      ...prev,
      ...updates,
    }));
  };

  const requiresContentsType = () => {
    return (
      data.itemType === "small-packet" ||
      data.itemType === "parcel"
    );
  };

  const getBasePrice = (): number => {
    const { itemType, weight, destination } = data;

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
  };

  const getAddOnPrice = (): number => {
    const { addOns, itemType } = data;
    let total = 0;

    if (addOns.tracking && itemType !== "parcel") {
      total += 1.5;
    }

    if (addOns.express) {
      total += 3.0;
    }

    if (addOns.insuranceSignature) {
      total += 2.5;
    }

    if (addOns.insurance) {
      total += 2.0;
    }

    if (addOns.additionalInsurance) {
      total += 5.0;
    }

    if (addOns.ddp) {
      total += 4.0;
    }

    return total;
  };

  const getTotalPrice = (): number => {
    return getBasePrice() + getAddOnPrice();
  };

  const getValidationErrors = (
    step: number,
  ): ValidationError[] => {
    const errors: ValidationError[] = [];

    if (step === 1) {
      if (!data.destination) {
        errors.push({
          field: "destination",
          message: "Please select a destination.",
        });
      }

      if (!data.itemType) {
        errors.push({
          field: "itemType",
          message: "Please choose an item type.",
        });
      }

      if (!data.weight || data.weight <= 0) {
        errors.push({
          field: "weight",
          message: "Please select a weight.",
        });
      }

      if (requiresContentsType() && !data.contents) {
        errors.push({
          field: "contents",
          message: "Please choose what’s inside.",
        });
      }
    }

    if (step === 2) {
      const region = getRegion(data.destination);

      if (region !== "ROI" && region !== "NI") {
        if (!data.customsType) {
          errors.push({
            field: "customsType",
            message: "Please select a shipment type.",
          });
        }

        if (
          !data.itemDescription ||
          data.itemDescription.trim().length < 3
        ) {
          errors.push({
            field: "itemDescription",
            message: "Please enter a valid description.",
          });
        }

        if (!data.declaredValue || data.declaredValue <= 0) {
          errors.push({
            field: "declaredValue",
            message: "Please enter the total value.",
          });
        }

        if (
          requiresTaricCode(
            data.destination,
            data.customsType,
          ) &&
          !data.taricCode.trim()
        ) {
          errors.push({
            field: "taricCode",
            message:
              "A TARIC code is required for this destination.",
          });
        }
      }
    }

    if (step === 3) {
      if (!data.selectedContact && !data.recipient) {
        errors.push({
          field: "recipient",
          message: "Please select or add a recipient.",
        });
      }
    }

    return errors;
  };

  const isStepValid = (step: number): boolean => {
    return getValidationErrors(step).length === 0;
  };

  const resetCheckout = () => {
    setData(initialData);
  };

  const value = useMemo(
    () => ({
      data,
      updateData,
      getBasePrice,
      getAddOnPrice,
      getTotalPrice,
      requiresContentsType,
      getValidationErrors,
      isStepValid,
      resetCheckout,
    }),
    [data],
  );

  return (
    <CheckoutContext.Provider value={value}>
      {children}
    </CheckoutContext.Provider>
  );
};

export const useCheckout = (): CheckoutContextType => {
  const context = useContext(CheckoutContext);

  if (!context) {
    throw new Error(
      "useCheckout must be used within a CheckoutProvider",
    );
  }

  return context;
};