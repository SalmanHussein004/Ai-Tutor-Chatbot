"use client";

import { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { FaSearch, FaPlus, FaPaperPlane, FaUserCircle } from 'react-icons/fa';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw'; // Enable raw HTML for better markdown rendering

export default function Home() {
  const [conversations, setConversations] = useState([
    {
      id: 1,
      name: 'Default Conversation',
      messages: [
        { role: 'assistant', content: 'Welcome to the Data Structures Tutor!' },
        { role: 'assistant', content: 'How can I assist you today?' },
      ],
    },
  ]);

  const [activeConversation, setActiveConversation] = useState(conversations[0]);
  const [input, setInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [newConversationName, setNewConversationName] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // Auto-scroll to the bottom when a new message is added
  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      if (scrollHeight - scrollTop === clientHeight) {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeConversation]);

  const handleSendMessage = async () => {
    if (input.trim()) {
      const newMessage = { role: 'user', content: input };
      const updatedMessages = [...(activeConversation?.messages || []), newMessage];

      const updatedConversation = {
        ...activeConversation,
        messages: updatedMessages,
      };
      setConversations(conversations.map((conv) =>
        conv.id === activeConversation.id ? updatedConversation : conv
      ));
      setActiveConversation(updatedConversation);

      setInput('');
      setIsTyping(true);

      // Send the message and receive the response immediately
      const botResponse = await getApiResponse(updatedMessages);
      const finalConversation = {
        ...updatedConversation,
        messages: [...updatedMessages, botResponse],
      };
      setConversations(conversations.map((conv) =>
        conv.id === activeConversation.id ? finalConversation : conv
      ));
      setActiveConversation(finalConversation);
      setIsTyping(false);
      scrollToBottom();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const getApiResponse = async (messages) => {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages }),  // Send the entire conversation history
      });

      if (!response.ok) {
        throw new Error(`API call failed with status ${response.status}`);
      }

      const data = await response.json();

      if (!data.response) {
        throw new Error('No response from GEMINI API');
      }

      return { role: 'assistant', content: data.response };
    } catch (error) {
      console.error('Error fetching GEMINI response:', error);
      return { role: 'assistant', content: "Sorry, I couldn't process that request." };
    }
  };

  const handleNewConversation = () => {
    const newConv = { id: Date.now(), name: '', messages: [], isEditing: true };
    setConversations([newConv, ...conversations]);
    setActiveConversation(newConv);
  };

  const handleConversationNameChange = (e) => {
    setNewConversationName(e.target.value);
  };

  const handleNameSave = () => {
    const updatedConversations = conversations.map((conv) =>
      conv.id === activeConversation.id ? { ...conv, name: newConversationName, isEditing: false } : conv
    );
    setConversations(updatedConversations);
    setActiveConversation({ ...activeConversation, name: newConversationName, isEditing: false });
    setNewConversationName('');
  };

  const filteredConversations = conversations.filter((conv) =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderMessage = (message, index) => {
    // Check if the message contains list-like content
    const isList = message.content.includes('- ') || message.content.includes('* ');
  
    return (
      <Message key={index} $isUser={message.role === 'user'}>
        <MessageContent $isUser={message.role === 'user'}>
          {isList ? (
            <ul>
              {message.content.split('\n').map((line, idx) => (
                <li key={idx}>{line.replace(/^- |^\* /, '')}</li>
              ))}
            </ul>
          ) : (
            <ReactMarkdown rehypePlugins={[rehypeRaw]}>{message.content}</ReactMarkdown>
          )}
        </MessageContent>
      </Message>
    );
  };
  

  return (
    <Container>
      <Header>
        <Title>Data Structures Assistant</Title>
      </Header>
      <MainContent>
        <Sidebar>
          <ProfileSection>
            <FaUserCircle size={40} />
            <ProfileName>Conversation Log</ProfileName>
          </ProfileSection>
          <SearchBar>
            <FaSearch />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </SearchBar>
          <ConversationList>
            {filteredConversations.map((conv, index) => (
              <ConversationItem
                key={index}
                $active={conv.id === activeConversation?.id}
                onClick={() => setActiveConversation(conv)}
              >
                <Avatar />
                <ConversationDetails>
                  {conv.isEditing ? (
                    <input
                      type="text"
                      value={newConversationName}
                      onChange={handleConversationNameChange}
                      onBlur={handleNameSave}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') handleNameSave();
                      }}
                      autoFocus
                    />
                  ) : (
                    <>
                      <Name>{conv.name || 'Unnamed Conversation'}</Name>
                      <LastMessage>{conv.messages?.[conv.messages.length - 1]?.content.slice(0, 30) || 'No messages yet'}...</LastMessage>
                    </>
                  )}
                </ConversationDetails>
              </ConversationItem>
            ))}
          </ConversationList>
          <NewConversationButton onClick={handleNewConversation}>
            <FaPlus /> New Conversation
          </NewConversationButton>
        </Sidebar>
        <ChatArea ref={messagesContainerRef}>
          <Messages>
            {activeConversation?.messages?.map(renderMessage)}
            {isTyping && <Message $isUser={false}><MessageContent $isUser={false}>...</MessageContent></Message>}
            <div ref={messagesEndRef} />
          </Messages>
          {activeConversation && (
            <InputArea>
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
              />
              <SendButton onClick={handleSendMessage}>
                <FaPaperPlane />
              </SendButton>
            </InputArea>
          )}
        </ChatArea>
      </MainContent>
    </Container>
  );
}

// Styled Components
const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #0a0a23;
`;

const Header = styled.div`
  padding: 15px;
  background: linear-gradient(135deg, #1e1e3f, #333);
  color: white;
  text-align: center;
  border-bottom: 2px solid #333;
`;

const Title = styled.h1`
  margin: 0;
  font-size: 1.5rem;
`;

const MainContent = styled.div`
  display: flex;
  flex: 1;
`;

const Sidebar = styled.div`
  width: 300px;
  background-color: #1e1e3f;
  display: flex;
  flex-direction: column;
  padding-top: 10px; /* Added space between search bar and conversations */
`;

const ProfileSection = styled.div`
  display: flex;
  align-items: center;
  padding: 20px;
  background-color: #333;
  color: white;
`;

const ProfileName = styled.div`
  margin-left: 10px;
  font-weight: bold;
  font-size: 1.2rem;
`;

const SearchBar = styled.div`
  display: flex;
  align-items: center;
  padding: 10px;
  background-color: #333;
  input {
    border: none;
    background: transparent;
    color: white;
    margin-left: 5px;
    outline: none;
    flex: 1;
  }
`;

const ConversationList = styled.div`
  flex: 1;
  overflow-y: auto;
`;

const ConversationItem = styled.div`
  display: flex;
  align-items: center;
  padding: 10px 20px;
  cursor: pointer;
  background-color: ${({ $active }) => ($active ? '#333' : 'transparent')};
  &:hover {
    background-color: #333;
  }
`;

const Avatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #666;
`;

const ConversationDetails = styled.div`
  margin-left: 10px;
  color: white;
  input {
    background-color: #333;
    border: none;
    padding: 5px;
    border-radius: 5px;
    color: white;
    width: 100%;
  }
`;

const Name = styled.div`
  font-weight: bold;
`;

const LastMessage = styled.div`
  font-size: 0.8rem;
  color: #aaa;
`;

const NewConversationButton = styled.button`
  background-color: #007aff;
  color: white;
  padding: 10px;
  border: none;
  border-radius: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  margin: 10px;

  &:hover {
    background-color: #005bb5;
  }
`;

const ChatArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: #0a0a23;
  overflow-y: auto;
`;

const Messages = styled.div`
  flex: 1;
  padding: 20px;
  overflow-y: auto;
`;

const Message = styled.div`
  display: flex;
  justify-content: ${({ $isUser }) => ($isUser ? 'flex-end' : 'flex-start')};
  margin-bottom: 10px;
`;

const MessageContent = styled.div`
  display: block;
  align-items: center;
  background-color: ${({ $isUser }) => ($isUser ? '#007aff' : '#333')};
  color: white;
  padding: 15px; /* Added padding for better spacing */
  border-radius: 20px;
  max-width: 60%;
  white-space: pre-wrap;
  word-wrap: break-word; /* Ensures long text wraps */
  word-break: normal; /* Prevents breaking words at random positions */
  box-shadow: 0px 2px 8px rgba(0, 0, 0, 0.2); /* Subtle shadow for depth */
  text-align: left; /* Ensures text aligns left for readability */
  line-height: 1.5; /* Adds some space between lines for better readability */
  overflow-wrap: break-word; /* Adds better word wrapping for long words */

  ul, ol {
    padding-left: 20px; /* Indent list items to align with the rest of the text */
    margin: 0; /* Remove any default margin to keep list within bubble */
  }

  li {
    margin-bottom: 5px; /* Add some space between list items */
  }

  b, strong {
    font-weight: bold;
  }
`;




const InputArea = styled.div`
  display: flex;
  padding: 20px;
  background-color: #1e1e3f;
`;

const Input = styled.input`
  flex: 1;
  padding: 10px;
  border: none;
  border-radius: 20px 0 0 20px;
  background-color: #2a2a2a;
  color: white;
  outline: none;
`;

const SendButton = styled.button`
  background-color: #007aff;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 0 20px 20px 0;
  cursor: pointer;

  :hover {
    background-color: #005bb5;
  }
`;
