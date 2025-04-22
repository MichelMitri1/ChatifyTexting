import React from "react";
import styles from "./chatLoadingPage.module.css";

export default function ChatLoadingPage() {
  return (
    <div
      className={`${styles.chatLoadingContainer} ${styles.chatLoadingContainerDisappear}`}
    >
      <div className={styles.contentWrapper}>
        <h1 className={styles.chatLoadingHeader}>
          Click On a Chat to Start Texting!
        </h1>
        <div className={styles.illustrationContainer}>
          <div className={styles.chatBubbleLeft}>
            <span>Hey!</span>
          </div>
          <div className={styles.chatBubbleRight}>
            <span>What's up?</span>
          </div>
          <div className={styles.chatBubbleLeft}>
            <span>How are you?</span>
          </div>
          <div className={styles.chatBubbleRight}>
            <span>I am doing fine and you?</span>
          </div>
          <div className={styles.chatBubbleLeft}>
            <span>I'm fine. Down to chat?</span>
          </div>
          <div className={styles.chatBubbleRight}>
            <span>Of course!</span>
          </div>
        </div>
      </div>
    </div>
  );
}
