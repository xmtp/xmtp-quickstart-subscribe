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
          signerTemp.contacts.consentState(subscriberAddress)
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
      className={`Subscribe ${loading ? "loading" : ""}`}
    >
      <button style={styles.SubscribeButton} onClick={handleClick}>
        {loading ? "Loading... " : subscriptionStatus}
      </button>
    </div>
  );
}
