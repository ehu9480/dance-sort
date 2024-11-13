import React from 'react';
import { Typewriter } from 'react-simple-typewriter';

function TypingText() {
  return (
    <h1 style={{ fontWeight: 'bold', fontSize: '2em', color: '#ffffff' }}>
      <Typewriter
        words={[ "Please log in with Google to get started" ]}
        loop={1} // How many times you want to loop through the strings
        cursor
        cursorStyle="_"
        typeSpeed={40}
      />
    </h1>
  );
}

export default TypingText;
