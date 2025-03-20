'use client';

import { useState, useRef, useEffect } from 'react';
import { Box, Button, Input, Text, VStack, Container, Spinner, Tooltip, Flex } from '@chakra-ui/react';
import HeaderNav from '@/components/HeaderNav';
import { askQuery, QueryCitation } from '../api';

type Message = {
  text: string;
  citations: QueryCitation[];
  isUser: boolean;
};

export default function Page() {
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleError = (err: unknown) => {
    if (err instanceof Error) {
      setError(err.message)
    } else {
      setError("An unknown error occurred")
    }
    setLoading(false);
  }

  const handleSubmit = async () => {
    if (!query.trim()) return;

    // Add user message
    setMessages([...messages, { text: query, citations: [], isUser: true }]);
    setLoading(true);

    try {
      const data = await askQuery(query);
      // Add AI response
      setMessages(prev => [...prev, {
        text: data.response,
        citations: data.citations || [],
        isUser: false
      }]);
      setError('');
    } catch (err) {
      handleError(err)
    } finally {
      setLoading(false);
      setQuery('');
      // Focus the input after response
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <Flex flexDirection="column" height="100vh">
      <HeaderNav signOut={() => { }} />
      <Flex flex="1" flexDirection="column" overflow="hidden">
        <Container maxW="2xl" p={4} flex="1" overflowY="auto" pb={24}>
          <VStack spacing={4} align="stretch">
            {messages.map((message, index) => (
              <Box
                key={index}
                p={4}
                bg={message.isUser ? "blue.100" : "gray.100"}
                borderRadius="md"
                alignSelf={message.isUser ? "flex-start" : "flex-end"}
                maxW="80%"
              >
                <Text>{message.text}</Text>
                {!message.isUser && message.citations.length > 0 && (
                  <Box mt={4}>
                    {message.citations.map((citation, idx) => (
                      <Tooltip key={idx} label={citation.text} aria-label={`Citation ${citation.number}`}>
                        <Text as="span" mr={2} cursor="pointer" color="blue.500">
                          [{citation.number}]
                        </Text>
                      </Tooltip>
                    ))}
                  </Box>
                )}
              </Box>
            ))}
            {loading && (
              <Box p={4} bg="gray.100" borderRadius="md" display="flex" justifyContent="center" alignSelf="flex-end" maxW="80%">
                <Spinner />
              </Box>
            )}
            {error && (
              <Box p={4} bg="red.100" borderRadius="md" alignSelf="flex-end" maxW="80%">
                <Text color="red.500">{error}</Text>
              </Box>
            )}
            <div ref={messagesEndRef} />
          </VStack>
        </Container>

        <Box position="fixed" bottom={0} width="100%" bg="white" p={4} borderTop="1px" borderColor="gray.200">
          <Container maxW="2xl">
            <Flex>
              <Input
                ref={inputRef}
                placeholder="Enter your query"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyUp={handleKeyPress}
                autoFocus
              />
              <Button onClick={handleSubmit} ml={2} isDisabled={loading || !query.trim()}>
                Submit
              </Button>
            </Flex>
          </Container>
        </Box>
      </Flex>
    </Flex>
  );
}
