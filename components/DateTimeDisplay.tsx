import React, { useState, useEffect } from 'react';
import { Text, View } from 'react-native';

const DateTimeDisplay = () => {
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000); // Update every second

    return () => clearInterval(timer); // Cleanup
  }, []);

  // Format the date and time
  const year = currentDateTime.getFullYear();
  const month = currentDateTime.getMonth() + 1; // getMonth() is 0-indexed
  const day = currentDateTime.getDate();
  const time = currentDateTime.toLocaleTimeString(); // Formats time based on device locale

  // For a specific format (e.g., "DD/MM/YYYY HH:MM AM/PM"), you can build the string:
  const formattedDate = `${day < 10 ? '0' + day : day}/${month < 10 ? '0' + month : month}/${year}`;
  const displayString = `${formattedDate}`;

  return (<>
   {displayString}
   </>);
};

export default DateTimeDisplay;
