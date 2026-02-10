import {
  reactExtension,
  Banner,
  BlockStack,
  InlineStack,
  Text,
  Button,
  Divider,
  useCartLines,
  useApplyCartLinesChange,
  useExtensionApi,
} from "@shopify/ui-extensions-react/checkout";
import { useState, useEffect } from "react";

const APP_URL = "https://roundup-for-charity.replit.app";

export default reactExtension("purchase.checkout.block.render", () => (
  <RoundUpDonation />
));

function RoundUpDonation() {
  const { sessionToken } = useExtensionApi();
  const cartLines = useCartLines();
  const applyCartLinesChange = useApplyCartLinesChange();

  const [settings, setSettings] = useState(null);
  const [charities, setCharities] = useState([]);
  const [donated, setDonated] = useState(false);
  const [donationAmount, setDonationAmount] = useState(0);
  const [loading, setLoading] = useState(true);

  const subtotal = cartLines.reduce(
    (sum, line) => sum + parseFloat(line.cost.totalAmount.amount),
    0
  );
  const roundUpAmount = subtotal > 0 ? Math.ceil(subtotal) - subtotal : 0;
  const effectiveRoundUp = roundUpAmount === 0 ? 1 : roundUpAmount;

  useEffect(() => {
    async function fetchData() {
      try {
        const token = await sessionToken.get();
        const headers = { Authorization: `Bearer ${token}` };

        const [settingsRes, charitiesRes] = await Promise.all([
          fetch(`${APP_URL}/api/ext/settings?channel=checkout`, { headers }),
          fetch(`${APP_URL}/api/ext/charities`, { headers }),
        ]);

        if (settingsRes.ok) setSettings(await settingsRes.json());
        if (charitiesRes.ok) setCharities(await charitiesRes.json());
      } catch (err) {
        console.error("Failed to load RoundUp config:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleDonate = async (type, amount) => {
    setDonationAmount(amount);

    try {
      const token = await sessionToken.get();
      await fetch(`${APP_URL}/api/ext/donations`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          charityId: selectedCharity?.id || "",
          amount: amount.toFixed(2),
          originalTotal: subtotal.toFixed(2),
          roundedTotal:
            type === "round_up"
              ? Math.ceil(subtotal).toFixed(2)
              : (subtotal + amount).toFixed(2),
          donationType: type,
          channel: "checkout",
          orderId: `CHECKOUT-${Date.now()}`,
        }),
      });

      setDonated(true);
    } catch (err) {
      console.error("Failed to record donation:", err);
    }
  };

  if (loading || !settings) return null;

  const selectedCharity =
    charities.find((c) => c.id === settings.defaultCharityId) || charities[0];
  const fixedAmounts = (settings.fixedAmounts || [1, 2, 5]);

  if (donated) {
    return (
      <Banner status="success" title={settings.thankYouMessage}>
        <Text>
          You donated ${donationAmount.toFixed(2)} to{" "}
          {selectedCharity?.name || "charity"}
        </Text>
      </Banner>
    );
  }

  return (
    <BlockStack spacing="base">
      <Banner title={settings.promptMessage || "Round up for charity?"}>
        {selectedCharity && (
          <Text size="small" appearance="subdued">
            Supporting {selectedCharity.name}
          </Text>
        )}
      </Banner>

      <InlineStack spacing="base">
        {settings.enableRoundUp && subtotal > 0 && (
          <Button
            kind="secondary"
            onPress={() => handleDonate("round_up", effectiveRoundUp)}
          >
            Round up +${effectiveRoundUp.toFixed(2)}
          </Button>
        )}

        {settings.enableFixedAmounts &&
          fixedAmounts.map((amount) => (
            <Button
              key={amount}
              kind="secondary"
              onPress={() => handleDonate("fixed", amount)}
            >
              +${amount.toFixed(2)}
            </Button>
          ))}
      </InlineStack>
    </BlockStack>
  );
}
