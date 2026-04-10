import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router";
import {
  Check,
  ChevronRight,
  UserPlus,
  ArrowLeft,
  MapPin,
  BookmarkPlus,
} from "lucide-react";
import { motion } from "motion/react";
import {
  useCheckout,
  SavedContact,
  SAVED_CONTACTS,
} from "../context/CheckoutContext";

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

export const Step3 = () => {
  const navigate = useNavigate();
  const { data, updateData } = useCheckout();

  const [showNewRecipientForm, setShowNewRecipientForm] =
    useState(false);
  const [ctaContainer, setCtaContainer] =
    useState<HTMLElement | null>(null);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    fullName: "",
    company: "",
    email: "",
    countryCode: "+353",
    phonePrefix: "",
    phoneNumber: "",
    addressLine1: "",
    addressLine2: "",
    addressLine3: "",
    city: "",
    state: "",
    postcode: "",
    country: data.destination || "",
    saveToAddressBook: false,
  });

  const region = useMemo(
    () => getRegion(data.destination),
    [data.destination],
  );

  const shouldSkipStep2 = region === "ROI" || region === "NI";
  const backRoute = shouldSkipStep2 ? "/step1" : "/step2";

  const filteredContacts = useMemo(
    () =>
      SAVED_CONTACTS.filter(
        (contact) => contact.country === data.destination,
      ),
    [data.destination],
  );

  const shouldShowSavedContacts = useMemo(
    () =>
      (data.destination === "Ireland" ||
        data.destination === "Germany") &&
      filteredContacts.length > 0,
    [data.destination, filteredContacts.length],
  );

  useEffect(() => {
    if (!shouldShowSavedContacts) {
      setShowNewRecipientForm(true);
    }
  }, [shouldShowSavedContacts]);

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      country: data.destination || "",
    }));
  }, [data.destination]);

  useEffect(() => {
    setCtaContainer(
      document.getElementById("bottom-cta-container"),
    );
  });

  const handleSelectContact = (contact: SavedContact) => {
    updateData({
      selectedContact: contact,
      recipient: null,
    });
  };

  const isFormValid = useMemo(() => {
    if (!showNewRecipientForm) {
      return !!data.selectedContact;
    }

    return Boolean(
      formData.fullName.trim() &&
        formData.addressLine1.trim() &&
        formData.city.trim() &&
        formData.postcode.trim(),
    );
  }, [showNewRecipientForm, data.selectedContact, formData]);

  const handleSubmit = () => {
    if (!isFormValid) return;

    if (showNewRecipientForm) {
      updateData({
        recipient: formData,
        selectedContact: null,
      });
    }

    navigate("/step4");
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getAvatarColor = (id: string) => {
    const colors = [
      "#86EFAC",
      "#FCA5A5",
      "#93C5FD",
      "#FCD34D",
      "#C4B5FD",
    ];
    const index = parseInt(id, 10) % colors.length;
    return colors[index];
  };

  if (showNewRecipientForm) {
    return (
      <div className="py-6 space-y-6">
        {/* Back button */}
        {shouldShowSavedContacts ? (
          <button
            onClick={() => setShowNewRecipientForm(false)}
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
        ) : (
          <button
            onClick={() => navigate(backRoute)}
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
        )}

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
            {shouldShowSavedContacts
              ? "Add new recipient"
              : "Who are you sending to?"}
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
            Enter the delivery address details.
          </p>
        </div>

        {/* Form */}
        <div className="space-y-5">
          <div>
            <label
              className="block mb-2"
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "11px",
                fontWeight: 700,
                color: "#6B7280",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              FULL NAME
            </label>
            <input
              type="text"
              placeholder="e.g. Seán O'Reilly"
              value={formData.fullName}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  fullName: e.target.value,
                })
              }
              className="w-full px-4 py-3.5 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-[#0D6F49]/20"
              style={{
                backgroundColor: "#FFFFFF",
                border: "1px solid #E5E7EB",
                fontFamily: "Inter, sans-serif",
                fontSize: "15px",
                fontWeight: 400,
                color: "#111827",
              }}
            />
          </div>

          <div>
            <label
              className="block mb-2"
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "11px",
                fontWeight: 700,
                color: "#6B7280",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              ADDRESS LINE 1
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="House number and street"
                value={formData.addressLine1}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    addressLine1: e.target.value,
                  })
                }
                className="w-full px-4 py-3.5 pr-11 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-[#0D6F49]/20"
                style={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E5E7EB",
                  fontFamily: "Inter, sans-serif",
                  fontSize: "15px",
                  fontWeight: 400,
                  color: "#111827",
                }}
              />
              <MapPin
                className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5"
                style={{ color: "#9CA3AF" }}
              />
            </div>
          </div>

          <div>
            <label
              className="block mb-2"
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "11px",
                fontWeight: 700,
                color: "#6B7280",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              ADDRESS LINE 2 (OPTIONAL)
            </label>
            <input
              type="text"
              placeholder="Apartment, suite, unit, etc"
              value={formData.addressLine2}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  addressLine2: e.target.value,
                })
              }
              className="w-full px-4 py-3.5 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-[#0D6F49]/20"
              style={{
                backgroundColor: "#FFFFFF",
                border: "1px solid #E5E7EB",
                fontFamily: "Inter, sans-serif",
                fontSize: "15px",
                fontWeight: 400,
                color: "#111827",
              }}
            />
          </div>

          <div>
            <label
              className="block mb-2"
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "11px",
                fontWeight: 700,
                color: "#6B7280",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              CITY/TOWN
            </label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  city: e.target.value,
                })
              }
              className="w-full px-4 py-3.5 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-[#0D6F49]/20"
              style={{
                backgroundColor: "#FFFFFF",
                border: "1px solid #E5E7EB",
                fontFamily: "Inter, sans-serif",
                fontSize: "15px",
                fontWeight: 400,
                color: "#111827",
              }}
            />
          </div>

          <div>
            <label
              className="block mb-2"
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "11px",
                fontWeight: 700,
                color: "#6B7280",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              EIRCODE/POSTCODE
            </label>
            <input
              type="text"
              value={formData.postcode}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  postcode: e.target.value,
                })
              }
              className="w-full px-4 py-3.5 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-[#0D6F49]/20"
              style={{
                backgroundColor: "#FFFFFF",
                border: "1px solid #E5E7EB",
                fontFamily: "Inter, sans-serif",
                fontSize: "15px",
                fontWeight: 400,
                color: "#111827",
              }}
            />
          </div>

          <div
            className="flex items-center justify-between p-4 rounded-xl"
            style={{
              backgroundColor: "#FEF3C7",
              border: "1px solid #FDE68A",
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: "#FBBF24" }}
              >
                <BookmarkPlus
                  className="w-5 h-5"
                  style={{ color: "#FFFFFF" }}
                />
              </div>
              <div>
                <div
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "#111827",
                    marginBottom: "1px",
                  }}
                >
                  Save to address book
                </div>
                <div
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "12px",
                    fontWeight: 400,
                    color: "#92400E",
                  }}
                >
                  Use this address for future deliveries
                </div>
              </div>
            </div>

            <button
              onClick={() =>
                setFormData({
                  ...formData,
                  saveToAddressBook:
                    !formData.saveToAddressBook,
                })
              }
              className="relative rounded-full transition-colors flex-shrink-0"
              style={{
                width: "48px",
                height: "28px",
                backgroundColor: formData.saveToAddressBook
                  ? "#10B981"
                  : "#D1D5DB",
              }}
            >
              <motion.div
                className="absolute top-1 rounded-full"
                style={{
                  width: "20px",
                  height: "20px",
                  backgroundColor: "#FFFFFF",
                }}
                animate={{
                  left: formData.saveToAddressBook
                    ? "26px"
                    : "4px",
                }}
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 30,
                }}
              />
            </button>
          </div>
        </div>

        {ctaContainer &&
          createPortal(
            <button
              onClick={handleSubmit}
              disabled={!isFormValid}
              className="px-7 py-3.5 rounded-xl transition-all disabled:opacity-40"
              style={{
                backgroundColor: "#0D6F49",
                color: "#FFFFFF",
                fontFamily: "Inter, sans-serif",
                fontSize: "15px",
                fontWeight: 600,
                boxShadow: isFormValid
                  ? "0 4px 16px rgba(13, 111, 73, 0.24)"
                  : "none",
              }}
            >
              Continue
            </button>,
            ctaContainer,
          )}
      </div>
    );
  }

  return (
    <div className="py-6 space-y-6">
      <button
        onClick={() => navigate(backRoute)}
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
          Who are you sending to?
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
          Select a contact or add a new delivery address.
        </p>
      </div>

      <button
        onClick={() => setShowNewRecipientForm(true)}
        className="w-full p-4 rounded-xl flex items-center gap-4 transition-all hover:shadow-md"
        style={{
          backgroundColor: "#FFFFFF",
          border: "2px solid #E5E7EB",
        }}
      >
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: "#FDE68A" }}
        >
          <UserPlus
            className="w-5 h-5"
            style={{ color: "#D97706" }}
          />
        </div>
        <div className="flex-1 text-left">
          <div
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "15px",
              fontWeight: 600,
              color: "#111827",
              marginBottom: "2px",
            }}
          >
            Add New Recipient
          </div>
          <div
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "13px",
              fontWeight: 400,
              color: "#6B7280",
            }}
          >
            Enter a new name and address
          </div>
        </div>
        <ChevronRight
          className="w-5 h-5"
          style={{ color: "#9CA3AF" }}
        />
      </button>

      {shouldShowSavedContacts && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "11px",
                fontWeight: 700,
                color: "#6B7280",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              SAVED CONTACTS
            </h2>
            <button
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "13px",
                fontWeight: 600,
                color: "#0D6F49",
              }}
            >
              View All
            </button>
          </div>

          <div className="space-y-3">
            {filteredContacts.map((contact) => {
              const isSelected =
                data.selectedContact?.id === contact.id;

              return (
                <motion.button
                  key={contact.id}
                  onClick={() => handleSelectContact(contact)}
                  className="w-full p-4 rounded-xl text-left transition-all"
                  style={{
                    backgroundColor: "#FFFFFF",
                    border: isSelected
                      ? "2px solid #0D6F49"
                      : "2px solid #E5E7EB",
                    position: "relative",
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-4 right-4 w-6 h-6 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: "#0D6F49" }}
                    >
                      <Check className="w-4 h-4 text-white" />
                    </motion.div>
                  )}

                  <div className="flex items-start gap-3">
                    <div
                      className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{
                        backgroundColor: getAvatarColor(
                          contact.id,
                        ),
                        fontFamily: "Inter, sans-serif",
                        fontSize: "15px",
                        fontWeight: 700,
                        color: "#111827",
                      }}
                    >
                      {getInitials(
                        contact.firstName,
                        contact.lastName,
                      )}
                    </div>

                    <div className="flex-1 pr-8">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          style={{
                            fontFamily: "Inter, sans-serif",
                            fontSize: "15px",
                            fontWeight: 600,
                            color: "#111827",
                          }}
                        >
                          {contact.firstName} {contact.lastName}
                        </span>
                        <span
                          className="px-2 py-0.5 rounded"
                          style={{
                            backgroundColor: "#FEF3C7",
                            fontFamily: "Inter, sans-serif",
                            fontSize: "10px",
                            fontWeight: 700,
                            color: "#92400E",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                          }}
                        >
                          {contact.id === "1"
                            ? "PERSONAL"
                            : "WORK"}
                        </span>
                      </div>
                      <div
                        style={{
                          fontFamily: "Inter, sans-serif",
                          fontSize: "13px",
                          fontWeight: 400,
                          color: "#6B7280",
                          lineHeight: "1.5",
                        }}
                      >
                        {contact.addressLine1}
                        <br />
                        {contact.city}{" "}
                        {contact.state && `${contact.state},`}{" "}
                        {contact.postcode}
                      </div>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      {ctaContainer &&
        createPortal(
          <button
            onClick={handleSubmit}
            disabled={!isFormValid}
            className="px-7 py-3.5 rounded-xl transition-all disabled:opacity-40"
            style={{
              backgroundColor: "#0D6F49",
              color: "#FFFFFF",
              fontFamily: "Inter, sans-serif",
              fontSize: "15px",
              fontWeight: 600,
              boxShadow: isFormValid
                ? "0 4px 16px rgba(13, 111, 73, 0.24)"
                : "none",
            }}
          >
            Continue
          </button>,
          ctaContainer,
        )}
    </div>
  );
};

export default Step3;