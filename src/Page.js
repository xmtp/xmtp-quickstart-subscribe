import React, { useState, useEffect } from "react";
import { Subscribe } from "./Subscribe";

const InboxPage = () => {
  const [subscribeArray, setSubscribeArray] = useState([]);

  const styles = {
    homePageWrapper: {
      textAlign: "center",
      marginTop: "2rem",
    },
  };

  return (
    <div style={styles.homePageWrapper}>
      <h1>Subscribe Button </h1>

      <Subscribe
        theme="default"
        size="medium"
        onConsentChange={(address, state) => {
          console.log("New subscriber: ", address, state);
          let subscriber = subscribeArray.find(
            (sub) => sub.address === address,
          );
          if (subscriber) subscriber.state = state;
          else subscribeArray.push({ address, state });

          setSubscribeArray(subscribeArray);
        }}
        onError={(error) => console.log("Error subscribing: " + error)}
        env="production"
      />
    </div>
  );
};

export default InboxPage;
