## Enabling Subscribers with XMTP

This tutorial will guide you on how to create a simple `Subscribe` button with consent that enables the user to subscribe to your messages or notifications.

![](video.gif)

#### Import libraries

Import the necessary XMTP and Ethereum packages. These libraries enable you to create an XMTP client and interact with the Ethereum blockchain.

```jsx
import React, { useEffect, useState } from "react";
import { Client } from "@xmtp/react-sdk";
import { ethers } from "ethers";
```

The receiver of the subscription is gong to be a random wallet generated by ethers, but you could send your own wallet as prop.

```jsx
// Check if signer exists, if not create a new one
let signerTemp = signer ? signer : null;
if (!signerTemp) {
  // Create a random wallet if wallet does not exist
  let randomWallet = wallet || ethers.Wallet.createRandom();
  // Create a new client with the random wallet
  signerTemp = await Client.create(randomWallet, { env: env });
  // Set the signer
  setSigner(signerTemp);
}
```

#### Subscribe with Ethereum Wallet

Your `connectWallet` function facilitates the connection to the user's Ethereum wallet.

```jsx
const connectWallet = async () => {
  if (typeof window.ethereum !== "undefined") {
    try {
      await window.ethereum.request({ method: "eth_requestAccounts" });
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      return provider.getSigner();
    } catch (error) {
      console.error("User rejected request", error);
    }
  } else {
    console.error("Metamask not found");
  }
};
```

#### Consent State Management

This section delves into a crucial part of the subscription widget — managing the consent state of a subscriber. We'll explore how to get the subscriber's address, refresh the consent list, get the current consent state, and then update it based on user actions.

#### Refresh the Consent List

To ensure we're working with the most up-to-date information, we refresh the consent list.

```jsx
signerTemp.contacts.refreshConsentList();
```

#### Retrieve the Current Consent State

After refreshing, we get the current consent state of the subscriber. Can be (`allowed`, `blocked`, or `unknown`)

```jsx
let state = signerTemp.contacts.consentState(subscriberAddress);
```

#### Update the Consent State

Based on the current state, we either allow or block the subscriber.

```jsx
if (state == "unknown" || state == "blocked") {
  await signerTemp.contacts.allow([subscriberAddress]);
} else if (state == "allowed") {
  await signerTemp.contacts.block([subscriberAddress]);
}
```

- If the state is `unknown` or `blocked`, we change it to `allowed` using `signerTemp.contacts.allow([address])`.
- If the state is `allowed`, we change it to `blocked` using `signerTemp.contacts.block([address])`.

#### Refresh the Consent List Again and Get the New State

After updating, we refresh the consent list again and check the new state to confirm that the change was successful.

```jsx
await signerTemp.contacts.refreshConsentList();
state = signerTemp.contacts.consentState(subscriberAddress);
```

We refresh the list and get the new consent state using the same methods as before.

#### Reference code

Copy paste the component into your project

```jsx
import React, { useEffect, useState } from "react";
import { Client } from "@xmtp/xmtp-js";
import { ethers } from "ethers";

export function Subscribe({
  wallet,
  onConsentChange,
  onError,
  env,
  label = "Subscribe with your wallet",
}) {
  // State for loading status
  const [loading, setLoading] = useState(false);
  // State for subscription status
  const [subscriptionStatus, setSubscriptionStatus] = useState(label);
  // State for random wallet address
  const [randomWalletAddress, setRandomWalletAddress] = useState(null);
  // State for signer
  const [signer, setSigner] = useState(null);
  // State for consent log
  const [consentLog, setConsentLog] = useState("");

  const styles = {
    SubscribeButtonContainer: {
      position: "relative",
      display: "inline-block",
      borderRadius: "5px",
      textAlign: "center",
      alignItems: "center",
    },
    SubscribeButton: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "10px 20px",
      borderRadius: "5px",
      marginBottom: "2px",
      textAlign: "left",
      cursor: "pointer",
      transition: "background-color 0.3s ease",
      fontWeight: "bold",
      color: "#333333",
      backgroundColor: "#ededed",
      border: "none",
      fontSize: "12px",
    },
  };

  const getAddress = async (signer) => {
    try {
      if (signer && typeof signer.getAddress === "function") {
        return await signer.getAddress();
      }
      if (signer && typeof signer.getAddresses === "function") {
        //viem
        const [address] = await signer.getAddresses();
        return address;
      }
      return null;
    } catch (e) {
      console.log(e);
    }
  };

  const connectWallet = async () => {
    if (typeof window.ethereum !== "undefined") {
      try {
        await window.ethereum.request({ method: "eth_requestAccounts" });
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        return provider.getSigner();
      } catch (error) {
        console.error("User rejected request", error);
      }
    } else {
      console.error("Metamask not found");
    }
  };

  // Define the handleClick function
  const handleClick = async () => {
    try {
      // Set loading to true
      setLoading(true);
      // Check if signer exists, if not create a new one
      let signerTemp = signer ? signer : null;
      if (!signerTemp) {
        // Create a random wallet if wallet does not exist
        let randomWallet = wallet || ethers.Wallet.createRandom();
        // Create a new client with the random wallet
        signerTemp = await Client.create(randomWallet, { env: env });
        // Set the signer
        setSigner(signerTemp);
      }
      // Set the random wallet address
      setRandomWalletAddress(signerTemp.address);

      // Get the subscriber address
      const subscriberAddress = await getAddress(await connectWallet());
      // Refresh the consent list
      signerTemp.contacts.refreshConsentList();
      // Get the consent state of the subscriber
      let state = signerTemp.contacts.consentState(subscriberAddress);
      // If the state is unknown or blocked, allow the subscriber
      if (state == "unknown" || state == "blocked") {
        await signerTemp.contacts.allow([subscriberAddress]);
      } else if (state == "allowed") {
        // If the state is allowed, block the subscriber
        await signerTemp.contacts.block([subscriberAddress]);
      }
      // Refresh the consent list again
      await signerTemp.contacts.refreshConsentList();
      // Get the new consent state
      state = signerTemp.contacts.consentState(subscriberAddress);

      // Create a log message
      let log =
        "Address " +
        subscriberAddress +
        " subscribed to random wallet: " +
        signerTemp.address;
      setConsentLog(log);
      console.log(log);

      // Set the subscription label
      setSubscriptionStatus("Consent State: " + state);

      // If onConsentChange function exists, call it with the subscriber address and consent state
      if (onConsentChange)
        onConsentChange(
          subscriberAddress,
          signerTemp.contacts.consentState(subscriberAddress),
        );

      // Set loading to false
      setLoading(false);
    } catch (error) {
      // If onError function exists, call it with the error
      if (typeof onError === "function") onError(error);
      // Log the error
      console.log(error);
    }
  };

  return (
    <div
      style={styles.SubscribeButtonContainer}
      className={`Subscribe ${loading ? "loading" : ""}`}>
      <button style={styles.SubscribeButton} onClick={handleClick}>
        {loading ? "Loading... " : subscriptionStatus}
      </button>
    </div>
  );
}
```

#### Conclusion

This tutorial guides you to build an XMTP subscription flow in React. If you want to learn how to send a message to your subscribers check out [Broadcast a message to multiple wallets](/Tutorials/Broadcast).

#### Reference Widget

For a complete working example, please refer to this complete widget page.

- [Subscribe Widget](/Widgets/Subscribe)
