'use client'
import { Box, Button, Stack, TextField } from '@mui/material'
import { useState, useRef, useEffect } from 'react'

export default function Home() {
  const [messages, setMessages] = useState([
      {
          role: "assistant",
          content: "Hello there, I'm the Headstarter Support Agent, how can I assist you today?",
      },
  ]);

  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const sendMessage = async () => {
      try {
          const newMessage = { role: "user", content: message };
          const updatedMessages = [
              ...messages,
              newMessage,
              { role: "assistant", content: "" },
          ];

          setMessage("");
          setMessages(updatedMessages);
          setIsLoading(true); // Set loading state to true

          console.log("Sending message:", newMessage);

          const response = await fetch("/api/chat", {
              method: "POST",
              headers: {
                  "Content-Type": "application/json",
              },
              body: JSON.stringify(updatedMessages),
          });

          if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
          }

          const reader = response.body.getReader();
          const decoder = new TextDecoder();

          reader.read().then(function processText({ done, value }) {
              if (done) {
                  setIsLoading(false); // Set loading state to false
                  return;
              }
              const text = decoder.decode(value || new Uint8Array(), {
                  stream: true,
              });
              console.log("Received text:", text);
              setMessages((messages) => {
                  let lastMessage = messages[messages.length - 1];
                  let otherMessages = messages.slice(0, messages.length - 1);
                  return [
                      ...otherMessages,
                      {
                          ...lastMessage,
                          content: lastMessage.content + text,
                      },
                  ];
              });
              return reader.read().then(processText);
          }).catch(err => {
              console.error("Error reading stream:", err);
              setIsLoading(false);
          });
      } catch (error) {
          console.error("Failed to send message:", error);
          setIsLoading(false); // Reset loading state on error
      }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !isLoading) {
      sendMessage();
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <Box
      width="100vw"
      height="100vh"
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
    >
      <Stack
        direction={'column'}
        width="500px"
        height="700px"
        border="1px solid black"
        p={2}
        spacing={3}
      >
        <Stack
          direction={'column'}
          spacing={2}
          flexGrow={1}
          overflow="auto"
          maxHeight="100%"
        >
          {messages.map((message, index) => (
            <Box
              key={index}
              display="flex"
              justifyContent={
                message.role === 'assistant' ? 'flex-start' : 'flex-end'
              }
            >
              <Box
                bgcolor={
                  message.role === 'assistant'
                    ? 'primary.main'
                    : 'secondary.main'
                }
                color="white"
                borderRadius={16}
                p={3}
              >
                {message.content}
              </Box>
            </Box>
          ))}
          <div ref={messagesEndRef} />
        </Stack>
        <Stack direction={'row'} spacing={2}>
          <TextField
            label="Message"
            fullWidth
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
          />
          <Button 
            variant="contained" 
            onClick={sendMessage}
            disabled={isLoading}
          >
            {isLoading ? 'Sending...' : 'Send'}
          </Button>
        </Stack>
      </Stack>
    </Box>
  )
}
