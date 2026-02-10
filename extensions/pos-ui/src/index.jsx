import {
  reactExtension,
  Screen,
  ScrollView,
  Navigator,
  Text,
  Button,
  Stack,
  Banner,
  useApi,
} from "@shopify/ui-extensions-react/point-of-sale";
import { useState, useEffect } from "react";

const APP_URL = "https://charity-checkout.replit.app";

const POSModal = () => {
  const api = useApi();
  const { cart, sessionToken } = api;

  const [settings, setSettings] = useState(null);
  const [charities, setCharities] = useState([]);
  const [donated, setDonated] = useState(false);
  const [donationAmount, setDonationAmount] = useState(0);
  const [loading, setLoading] = useState(true);

  const subtotal = cart?.subtotal ? parseFloat(cart.subtotal) : 0;
  const roundUpAmount = subtotal > 0 ? Math.ceil(subtotal) - subtotal : 0;
  const effectiveRoundUp = roundUpAmount === 0 ? 1 : roundUpAmount;

  useEffect(() => {
    async function fetchData() {
      try {
        const token = await sessionToken.get();
        const headers = { Authorization: `Bearer ${token}` };

        const [settingsRes, charitiesRes] = await Promise.all([
          fetch(`${APP_URL}/api/ext/settings?channel=pos`, { headers }),
          fetch(`${APP_URL}/api/ext/charities`, { headers }),
        ]);

        if (settingsRes.ok) setSettings(await settingsRes.json());
        if (charitiesRes.ok) setCharities(await charitiesRes.json());
      } catch (err) {
        console.error("Failed to load RoundUp POS config:", err);
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
          channel: "pos",
          orderId: `POS-${Date.now()}`,
          posLocationId: cart?.locationId || "unknown",
        }),
      });

      setDonated(true);
    } catch (err) {
      console.error("Failed to record POS donation:", err);
    }
  };

  const handleClose = () => {
    api.navigation.dismiss();
  };

  if (loading) {
    return (
      <Navigator>
        <Screen name="loading" title="RoundUp for Charity">
          <ScrollView>
            <Stack direction="vertical" spacing="4">
              <Text>Loading...</Text>
            </Stack>
          </ScrollView>
        </Screen>
      </Navigator>
    );
  }

  if (!settings) {
    return (
      <Navigator>
        <Screen name="error" title="RoundUp for Charity">
          <ScrollView>
            <Banner status="warning" title="Unable to load donation settings" />
            <Button title="Close" onPress={handleClose} />
          </ScrollView>
        </Screen>
      </Navigator>
    );
  }

  const selectedCharity =
    charities.find((c) => c.id === settings.defaultCharityId) || charities[0];
  const fixedAmounts = settings.fixedAmounts || [1, 2, 5];

  if (donated) {
    return (
      <Navigator>
        <Screen name="thankyou" title="Thank You!">
          <ScrollView>
            <Stack direction="vertical" spacing="4" alignment="center">
              <Banner status="success" title={settings.thankYouMessage} />
              <Text size="large">
                Donated ${donationAmount.toFixed(2)} to{" "}
                {selectedCharity?.name || "charity"}
              </Text>
              <Button title="Done" onPress={handleClose} />
            </Stack>
          </ScrollView>
        </Screen>
      </Navigator>
    );
  }

  return (
    <Navigator>
      <Screen name="prompt" title="RoundUp for Charity">
        <ScrollView>
          <Stack direction="vertical" spacing="4">
            <Text size="large">
              {settings.promptMessage || "Would you like to round up for charity?"}
            </Text>

            {selectedCharity && (
              <Text size="small" subdued>
                Supporting {selectedCharity.name}
              </Text>
            )}

            <Text>Order total: ${subtotal.toFixed(2)}</Text>

            {settings.enableRoundUp && subtotal > 0 && (
              <Button
                title={`Round up to $${Math.ceil(subtotal).toFixed(2)} (+$${effectiveRoundUp.toFixed(2)})`}
                type="primary"
                onPress={() => handleDonate("round_up", effectiveRoundUp)}
              />
            )}

            {settings.enableFixedAmounts &&
              fixedAmounts.map((amount) => (
                <Button
                  key={amount}
                  title={`Donate $${amount.toFixed(2)}`}
                  type="basic"
                  onPress={() => handleDonate("fixed", amount)}
                />
              ))}

            <Button title="No thanks" type="plain" onPress={handleClose} />
          </Stack>
        </ScrollView>
      </Screen>
    </Navigator>
  );
};

export default reactExtension("pos.purchase.post.action.render", () => (
  <POSModal />
));
