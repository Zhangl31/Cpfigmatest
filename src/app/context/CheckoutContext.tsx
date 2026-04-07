import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type ItemType =
  | "letter"
  | "large-envelope"
  | "small-packet"
  | "parcel"
  | null;

export type ContentsType = "documents only" | "goods" | null;

export type CustomsType =
  | "documents"
  | "sale_of_goods"
  | "gift"
  | "returned_goods"
  | "commercial_sample"
  | null;

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
  state: string;
  postcode?: string;
  country: string;
}

export interface RecipientData {
  firstName: string;
  lastName: string;
  company?: string;
  email?: string;
  countryCode: string;
  phonePrefix: string;
  phoneNumber: string;
  addressLine1: string;
  addressLine2?: string;
  addressLine3?: string;
  city: string;
  state: string;
  postcode?: string;
  country: string;
  saveToAddressBook: boolean;
}

export interface AddOns {
  tracking: boolean;
  express: boolean;
  insuranceSignature: boolean;
  insurance: boolean;
  additionalInsurance: boolean;
  ddp: boolean;
}

export interface CheckoutData {
  itemType: ItemType;
  contents: ContentsType;
  destination: string;
  weight: number;
  recipient: RecipientData | null;
  selectedContact: SavedContact | null;
  addOns: AddOns;
  customsType: CustomsType;
  itemDescription: string;
  declaredValue: number;
  taricCode: string;
  labelPdfUrl: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

interface CheckoutContextType {
  data: CheckoutData;
  updateData: (updates: Partial<CheckoutData>) => void;
  resetCheckout: () => void;
  resetAddOns: () => void;
  getBasePrice: () => number;
  getAddOnPrice: () => number;
  getTotalPrice: () => number;
  getWeightLimits: () => {
    min: number;
    max: number;
    default: number;
  } | null;
  canShowPrice: () => boolean;
  getValidationErrors: (step?: number) => ValidationError[];
  isStepValid: (step: number) => boolean;
  requiresContentsType: () => boolean;
}

const CheckoutContext = createContext<
  CheckoutContextType | undefined
>(undefined);

export const SAVED_CONTACTS: SavedContact[] = [
  {
    id: "1",
    firstName: "Sarah",
    lastName: "Murphy",
    company: "Tech Solutions Ltd",
    email: "sarah@techsolutions.ie",
    phone: "+353 86 123 4567",
    addressLine1: "15 O'Connell Street",
    city: "Dublin",
    state: "Dublin",
    postcode: "D01 F5P2",
    country: "Ireland",
  },
  {
    id: "2",
    firstName: "James",
    lastName: "O'Brien",
    email: "james.obrien@email.co.uk",
    phone: "+44 20 7946 0958",
    addressLine1: "42 Baker Street",
    addressLine2: "Flat 3B",
    city: "London",
    state: "Greater London",
    postcode: "NW1 6XE",
    country: "United Kingdom",
  },
  {
    id: "3",
    firstName: "Klaus",
    lastName: "Schmidt",
    company: "Bauer Industries",
    email: "k.schmidt@bauer.de",
    phone: "+49 30 1234567",
    addressLine1: "Hauptstraße 45",
    city: "Berlin",
    state: "Berlin",
    postcode: "10115",
    country: "Germany",
  },
  {
    id: "4",
    firstName: "Emma",
    lastName: "Walsh",
    email: "emma.walsh@gmail.com",
    phone: "+353 87 654 3210",
    addressLine1: "28 Grafton Street",
    city: "Cork",
    state: "Cork",
    postcode: "T12 K8PW",
    country: "Ireland",
  },
];

export const WEIGHT_LIMITS: Record<
  NonNullable<ItemType>,
  { min: number; max: number; default: number }
> = {
  letter: { min: 0.01, max: 0.1, default: 0.05 },
  "large-envelope": { min: 0.01, max: 0.5, default: 0.1 },
  "small-packet": { min: 0.01, max: 2, default: 0.1 },
  parcel: { min: 0.1, max: 30, default: 0.5 },
};

const WEIGHT_BAND_CONFIG: Partial<
  Record<
    NonNullable<ItemType>,
    { bandSize: number; additionalRate: number }
  >
> = {
  parcel: { bandSize: 0.5, additionalRate: 0.1 },
  "small-packet": { bandSize: 0.1, additionalRate: 0.2 },
  "large-envelope": { bandSize: 0.1, additionalRate: 0.3 },
};

export const REQUIRES_CONTENTS_ITEM_TYPES: ItemType[] = [
  "letter",
  "large-envelope",
  "small-packet",
];

export const DOMESTIC_DESTINATIONS = ["Ireland"];

const DEFAULT_ADD_ONS: AddOns = {
  tracking: false,
  express: false,
  insuranceSignature: false,
  insurance: false,
  additionalInsurance: false,
  ddp: false,
};

const BASE_RATES: Record<
  NonNullable<ItemType>,
  Record<string, number>
> = {
  letter: {
    Ireland: 1.5,
    "United Kingdom": 2.5,
    Germany: 3.5,
    France: 3.5,
    Spain: 3.5,
    "United States": 5.0,
    "Northern Ireland": 2.5,
    Australia: 5.0,
    Canada: 5.0,
  },
  "large-envelope": {
    Ireland: 2.5,
    "United Kingdom": 3.5,
    Germany: 4.5,
    France: 4.5,
    Spain: 4.5,
    "United States": 6.0,
    "Northern Ireland": 3.5,
    Australia: 6.0,
    Canada: 6.0,
  },
  "small-packet": {
    Ireland: 4.5,
    "United Kingdom": 5.5,
    Germany: 6.5,
    France: 6.5,
    Spain: 6.5,
    "United States": 10.0,
    "Northern Ireland": 5.5,
    Australia: 10.0,
    Canada: 10.0,
  },
  parcel: {
    Ireland: 6.5,
    "United Kingdom": 8.5,
    Germany: 12.5,
    France: 12.5,
    Spain: 12.5,
    "United States": 18.0,
    "Northern Ireland": 8.5,
    Australia: 18.0,
    Canada: 18.0,
  },
};

const createInitialCheckoutData = (): CheckoutData => ({
  itemType: null,
  contents: null,
  destination: "",
  weight: 0,
  recipient: null,
  selectedContact: null,
  addOns: { ...DEFAULT_ADD_ONS },
  customsType: null,
  itemDescription: "",
  declaredValue: 0,
  taricCode: "",
  labelPdfUrl: "",
});

function cloneDefaultAddOns(): AddOns {
  return { ...DEFAULT_ADD_ONS };
}

function getClampedWeight(
  itemType: NonNullable<ItemType>,
  weight: number,
) {
  const limits = WEIGHT_LIMITS[itemType];
  return Math.min(Math.max(weight, limits.min), limits.max);
}

function calculateBasePrice(data: CheckoutData): number {
  if (!data.itemType || !data.destination || data.weight <= 0)
    return 0;

  const limits = WEIGHT_LIMITS[data.itemType];
  if (data.weight < limits.min || data.weight > limits.max)
    return 0;

  const base =
    BASE_RATES[data.itemType]?.[data.destination] ?? 0;
  if (!base) return 0;

  const clampedWeight = getClampedWeight(
    data.itemType,
    data.weight,
  );
  const config = WEIGHT_BAND_CONFIG[data.itemType];

  if (config) {
    const weightBands = Math.ceil(
      clampedWeight / config.bandSize,
    );
    const additionalBands = Math.max(0, weightBands - 1);
    return (
      base + additionalBands * base * config.additionalRate
    );
  }

  const weightBands = Math.ceil(clampedWeight / 0.1);
  return base * weightBands;
}

function calculateAddOnPrice(data: CheckoutData): number {
  if (!data.itemType || !data.destination || data.weight <= 0)
    return 0;

  let total = 0;

  if (data.addOns.tracking && data.itemType !== "parcel")
    total += 1.5;
  if (data.addOns.express) total += 3.0;
  if (data.addOns.insuranceSignature) total += 2.5;
  if (data.addOns.insurance) total += 2.0;
  if (data.addOns.additionalInsurance) total += 5.0;
  if (data.addOns.ddp) total += 4.0;

  return total;
}

export const CheckoutProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [data, setData] = useState<CheckoutData>(
    createInitialCheckoutData(),
  );

  const resetCheckout = useCallback(() => {
    setData(createInitialCheckoutData());
  }, []);

  const resetAddOns = useCallback(() => {
    setData((prev) => ({
      ...prev,
      addOns: cloneDefaultAddOns(),
    }));
  }, []);

  const updateData = useCallback(
    (updates: Partial<CheckoutData>) => {
      setData((prev) => {
        const next: CheckoutData = {
          ...prev,
          ...updates,
          addOns: updates.addOns
            ? { ...updates.addOns }
            : prev.addOns,
        };

        const itemTypeChanged =
          updates.itemType !== undefined &&
          updates.itemType !== prev.itemType;
        const destinationChanged =
          updates.destination !== undefined &&
          updates.destination !== prev.destination;
        const contentsChanged =
          updates.contents !== undefined &&
          updates.contents !== prev.contents;

        if (itemTypeChanged) {
          next.weight = 0;
          next.contents = null;
          next.addOns = cloneDefaultAddOns();
        }

        if (destinationChanged) {
          next.itemType = updates.itemType ?? next.itemType;
          next.weight = 0;
          next.contents = null;
          next.addOns = cloneDefaultAddOns();
        }

        if (contentsChanged) {
          next.addOns = cloneDefaultAddOns();
        }

        return next;
      });
    },
    [],
  );

  const getWeightLimits = useCallback(() => {
    if (!data.itemType) return null;
    return WEIGHT_LIMITS[data.itemType];
  }, [data.itemType]);

  const requiresContentsType = useCallback((): boolean => {
    if (!data.itemType || !data.destination) return false;
    if (DOMESTIC_DESTINATIONS.includes(data.destination))
      return false;
    if (data.itemType === "parcel") return false;
    return REQUIRES_CONTENTS_ITEM_TYPES.includes(data.itemType);
  }, [data.destination, data.itemType]);

  const canShowPrice = useCallback((): boolean => {
    if (!data.itemType || !data.destination || data.weight <= 0)
      return false;

    const limits = WEIGHT_LIMITS[data.itemType];
    if (data.weight < limits.min || data.weight > limits.max)
      return false;

    if (requiresContentsType() && !data.contents) return false;

    return true;
  }, [
    data.contents,
    data.destination,
    data.itemType,
    data.weight,
    requiresContentsType,
  ]);

  const getValidationErrors = useCallback(
    (step?: number): ValidationError[] => {
      const errors: ValidationError[] = [];

      if (step === undefined || step === 1) {
        if (!data.itemType) {
          errors.push({
            field: "itemType",
            message: "Please select a mail type",
          });
        }

        if (!data.destination) {
          errors.push({
            field: "destination",
            message: "Please select a destination",
          });
        }

        if (data.itemType && data.weight <= 0) {
          errors.push({
            field: "weight",
            message: "Please select a weight",
          });
        }

        if (data.itemType && data.weight > 0) {
          const limits = WEIGHT_LIMITS[data.itemType];

          if (data.weight < limits.min) {
            errors.push({
              field: "weight",
              message: `Minimum weight is ${limits.min}kg`,
            });
          }

          if (data.weight > limits.max) {
            errors.push({
              field: "weight",
              message: `Maximum weight is ${limits.max}kg`,
            });
          }
        }

        if (requiresContentsType() && !data.contents) {
          errors.push({
            field: "contents",
            message: "Please select what's inside",
          });
        }
      }

      if (step === undefined || step === 2) {
        if (!data.recipient && !data.selectedContact) {
          errors.push({
            field: "recipient",
            message: "Please enter recipient details",
          });
        }
      }

      return errors;
    },
    [
      data.contents,
      data.destination,
      data.itemType,
      data.recipient,
      data.selectedContact,
      data.weight,
      requiresContentsType,
    ],
  );

  const isStepValid = useCallback(
    (step: number): boolean =>
      getValidationErrors(step).length === 0,
    [getValidationErrors],
  );

  const getBasePrice = useCallback((): number => {
    if (!canShowPrice()) return 0;
    return calculateBasePrice(data);
  }, [canShowPrice, data]);

  const getAddOnPrice = useCallback((): number => {
    if (!canShowPrice()) return 0;
    return calculateAddOnPrice(data);
  }, [canShowPrice, data]);

  const getTotalPrice = useCallback((): number => {
    if (!canShowPrice()) return 0;
    return getBasePrice() + getAddOnPrice();
  }, [canShowPrice, getAddOnPrice, getBasePrice]);

  const value = useMemo<CheckoutContextType>(
    () => ({
      data,
      updateData,
      resetCheckout,
      resetAddOns,
      getBasePrice,
      getAddOnPrice,
      getTotalPrice,
      getWeightLimits,
      canShowPrice,
      getValidationErrors,
      isStepValid,
      requiresContentsType,
    }),
    [
      data,
      updateData,
      resetCheckout,
      resetAddOns,
      getBasePrice,
      getAddOnPrice,
      getTotalPrice,
      getWeightLimits,
      canShowPrice,
      getValidationErrors,
      isStepValid,
      requiresContentsType,
    ],
  );

  return (
    <CheckoutContext.Provider value={value}>
      {children}
    </CheckoutContext.Provider>
  );
};

export const useCheckout = () => {
  const context = useContext(CheckoutContext);

  if (!context) {
    throw new Error(
      "useCheckout must be used within a CheckoutProvider",
    );
  }

  return context;
};