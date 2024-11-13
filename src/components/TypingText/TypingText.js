// TypingText.js
import React, { useState, useEffect } from 'react';
import Typical from 'react-typical';
import './TypingText.css';


function TypingText({text}) {
  return (
    <div className="typing-text">
      <Typical
        steps={[text, 2000]}
        loop={1}
        wrapper="h2"
      />
    </div>
  );
}

export default TypingText;