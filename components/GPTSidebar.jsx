"use client"
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { PromptBox } from '@/components/ui/chatgpt-prompt-input';
import { Sparkles, Bot, User, X, Trash2, Copy, Check } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import Image from 'next/image';

const escapeHtml = (value = '') =>
    value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

const inlineMarkdownToHtml = (text = '') => {
    const escaped = escapeHtml(text);
    return escaped
        .replace(/`([^`]+)`/g, '<code class="rounded bg-zinc-200 px-1.5 py-0.5 text-xs font-mono text-zinc-900 dark:bg-zinc-800/70 dark:text-orange-300">$1</code>')
        .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-amber-700 dark:text-yellow-300">$1</strong>')
        .replace(/\*([^*]+)\*/g, '<em class="italic text-cyan-700 dark:text-cyan-300">$1</em>')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer" class="underline text-blue-700 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300">$1</a>');
};

const highlightCode = (code = '', language = '') => {
    const escaped = escapeHtml(code);
    const placeholders = [];

    const applyToken = (input, pattern, className, formatter) => {
        return input.replace(pattern, (...args) => {
            const match = args[0];
            const token = `__TOK_A_${placeholders.length}__`;
            const formatted = formatter ? formatter(...args) : match;
            placeholders.push(`<span class="${className}">${formatted}</span>`);
            return token;
        });
    };

    let highlighted = escaped;

    // Keep sensitive tokens first so later patterns do not re-highlight inside them.
    highlighted = applyToken(highlighted, /("(?:\\.|[^"])*"|'(?:\\.|[^'])*'|`(?:\\.|[^`])*`)/g, 'text-emerald-300');
    highlighted = applyToken(highlighted, /(\/\*[\s\S]*?\*\/|\/\/.*$|#.*$)/gm, 'text-zinc-400 italic');
    highlighted = applyToken(highlighted, /(&lt;\/?[A-Za-z][^&]*?&gt;)/g, 'text-rose-300');

    if (language && ['json', 'yaml', 'yml'].includes(language.toLowerCase())) {
        highlighted = applyToken(highlighted, /("[^"]+"\s*:)/g, 'text-blue-300');
        highlighted = applyToken(highlighted, /(:\s*)("[^"]+")/g, 'text-emerald-300', (_match, prefix, value) => `${prefix}${value}`);
    }

    const keywordPattern = /\b(const|let|var|function|return|if|else|for|while|switch|case|break|continue|class|extends|new|try|catch|finally|throw|import|from|export|default|async|await|public|private|protected|static|void|int|float|double|boolean|bool|interface|type|enum|implements|package|def|lambda|in|not|and|or|pass|yield|with|as|SELECT|FROM|WHERE|JOIN|INNER|LEFT|RIGHT|GROUP|BY|ORDER|LIMIT|INSERT|INTO|VALUES|UPDATE|SET|DELETE|CREATE|TABLE|ALTER|DROP)\b/g;
    highlighted = applyToken(highlighted, keywordPattern, 'text-cyan-300 font-medium');
    highlighted = applyToken(highlighted, /\b(true|false|null|undefined|None)\b/g, 'text-purple-300');
    highlighted = applyToken(highlighted, /\b(\d+(?:\.\d+)?)\b/g, 'text-amber-300');
    highlighted = applyToken(highlighted, /\b([A-Za-z_][A-Za-z0-9_]*)\s*(?=\()/g, 'text-sky-300');

    highlighted = highlighted.replace(/__TOK_A_(\d+)__/g, (_, index) => placeholders[Number(index)] || '');

    return highlighted;
};

const renderMarkdown = (content = '', options = {}) => {
    const { onCopyCode, copiedCodeId, onResetCodeCopy } = options;
    const lines = String(content).replace(/\r\n/g, '\n').split('\n');
    const blocks = [];
    let currentParagraph = [];
    let currentList = null;
    let currentCode = null;

    const parseTableRow = (line = '') =>
        line
            .trim()
            .replace(/^\||\|$/g, '')
            .split('|')
            .map((cell) => cell.trim());

    const isTableSeparatorLine = (line = '') => {
        const cells = parseTableRow(line);
        if (!cells.length) return false;
        return cells.every((cell) => /^:?-{3,}:?$/.test(cell.replace(/\s/g, '')));
    };

    const flushParagraph = () => {
        if (!currentParagraph.length) return;
        blocks.push({ type: 'paragraph', text: currentParagraph.join(' ') });
        currentParagraph = [];
    };

    const flushList = () => {
        if (!currentList) return;
        blocks.push(currentList);
        currentList = null;
    };

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        const line = lines[lineIndex];
        const trimmed = line.trimEnd();
        const codeFence = trimmed.match(/^```(.*)$/);

        if (currentCode) {
            if (trimmed.startsWith('```')) {
                blocks.push({ type: 'code', language: currentCode.language, code: currentCode.lines.join('\n') });
                currentCode = null;
            } else {
                currentCode.lines.push(line);
            }
            continue;
        }

        if (codeFence) {
            flushParagraph();
            flushList();
            currentCode = { language: codeFence[1].trim(), lines: [] };
            continue;
        }

        const nextLine = lines[lineIndex + 1] ?? '';
        if (
            trimmed.includes('|') &&
            nextLine.includes('|') &&
            isTableSeparatorLine(nextLine)
        ) {
            flushParagraph();
            flushList();

            const headers = parseTableRow(trimmed);
            const rows = [];

            lineIndex += 2;
            while (lineIndex < lines.length) {
                const rowLine = lines[lineIndex].trim();
                if (!rowLine || !rowLine.includes('|')) {
                    lineIndex -= 1;
                    break;
                }
                rows.push(parseTableRow(rowLine));
                lineIndex += 1;
            }

            if (headers.length) {
                blocks.push({ type: 'table', headers, rows });
                continue;
            }
        }

        if (!trimmed) {
            flushParagraph();
            flushList();
            continue;
        }

        const heading = trimmed.match(/^(#{1,3})\s+(.*)$/);
        if (heading) {
            flushParagraph();
            flushList();
            blocks.push({ type: 'heading', level: heading[1].length, text: heading[2] });
            continue;
        }

        const blockquote = trimmed.match(/^>\s+(.*)$/);
        if (blockquote) {
            flushParagraph();
            flushList();
            blocks.push({ type: 'blockquote', text: blockquote[1] });
            continue;
        }

        const bullet = trimmed.match(/^[-*+]\s+(.*)$/);
        const ordered = trimmed.match(/^\d+\.\s+(.*)$/);
        if (bullet || ordered) {
            flushParagraph();
            if (!currentList || currentList.ordered !== Boolean(ordered)) {
                flushList();
                currentList = { type: 'list', ordered: Boolean(ordered), items: [] };
            }
            currentList.items.push((bullet || ordered)[1]);
            continue;
        }

        flushList();
        currentParagraph.push(trimmed);
    }

    flushParagraph();
    flushList();

    return blocks.map((block, index) => {
        if (block.type === 'heading') {
            const Tag = `h${Math.min(block.level + 1, 3)}`;
            const sizeClass = block.level === 1 ? 'text-xl' : block.level === 2 ? 'text-lg' : 'text-base';
            return <Tag key={index} className={`font-bold mt-4 mb-2 text-blue-700 dark:text-blue-300 ${sizeClass}`} dangerouslySetInnerHTML={{ __html: inlineMarkdownToHtml(block.text) }} />;
        }

        if (block.type === 'blockquote') {
            return <blockquote key={index} className="my-2 border-l-4 border-blue-500 pl-4 italic text-zinc-700 dark:text-zinc-300" dangerouslySetInnerHTML={{ __html: inlineMarkdownToHtml(block.text) }} />;
        }

        if (block.type === 'list') {
            const ListTag = block.ordered ? 'ol' : 'ul';
            return (
                <ListTag key={index} className={`my-2 ml-4 space-y-1 ${block.ordered ? 'list-decimal' : 'list-disc'}`}>
                    {block.items.map((item, itemIndex) => (
                        <li key={itemIndex} className="text-sm" dangerouslySetInnerHTML={{ __html: inlineMarkdownToHtml(item) }} />
                    ))}
                </ListTag>
            );
        }

        if (block.type === 'table') {
            return (
                <div key={index} className="my-3 overflow-x-auto rounded-xl border border-zinc-300/80 bg-zinc-50 dark:border-zinc-700/70 dark:bg-zinc-900/35">
                    <table className="min-w-full border-collapse text-left text-xs text-zinc-800 dark:text-zinc-100 md:text-sm">
                        <thead className="bg-zinc-100 text-zinc-700 dark:bg-zinc-800/70 dark:text-zinc-200">
                            <tr>
                                {block.headers.map((header, headerIndex) => (
                                    <th
                                        key={headerIndex}
                                        className="border-b border-zinc-300 px-3 py-2 font-semibold dark:border-zinc-700"
                                        dangerouslySetInnerHTML={{ __html: inlineMarkdownToHtml(header) }}
                                    />
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {block.rows.map((row, rowIndex) => (
                                <tr key={rowIndex} className="odd:bg-white even:bg-zinc-50 dark:odd:bg-zinc-900/20 dark:even:bg-zinc-800/20">
                                    {block.headers.map((_, cellIndex) => (
                                        <td
                                            key={cellIndex}
                                            className="border-t border-zinc-300/80 px-3 py-2 align-top dark:border-zinc-700/60"
                                            dangerouslySetInnerHTML={{ __html: inlineMarkdownToHtml(row[cellIndex] || '') }}
                                        />
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            );
        }

        if (block.type === 'code') {
            const languageLabel = block.language || 'code';
            const codeCopyId = `code-${index}-${languageLabel}`;
            const highlightedCode = highlightCode(block.code, languageLabel);
            return (
                <div key={index} className="my-3 overflow-hidden rounded-xl border border-zinc-300/80 bg-zinc-100 shadow-sm dark:border-zinc-600/60 dark:bg-zinc-900/45 dark:shadow-md">
                    <div className="flex items-center justify-between border-b border-zinc-300 bg-zinc-200/80 px-3 py-2 dark:border-zinc-600/60 dark:bg-zinc-800/75">
                        <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-zinc-600 dark:text-zinc-400">{languageLabel}</span>
                        <button
                            onClick={() => onCopyCode?.(block.code, codeCopyId)}
                            onMouseLeave={() => onResetCodeCopy?.()}
                            className="inline-flex items-center gap-1 rounded-md border border-zinc-300 bg-white px-2 py-1 text-[11px] text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-700/80 dark:text-zinc-100 dark:hover:bg-zinc-600"
                            title="Copy code"
                            type="button"
                        >
                            {copiedCodeId === codeCopyId ? (
                                <>
                                    <Check className="h-3.5 w-3.5" />
                                    Copied
                                </>
                            ) : (
                                <>
                                    <Copy className="h-3.5 w-3.5" />
                                    Copy
                                </>
                            )}
                        </button>
                    </div>
                    <pre className="max-h-105 overflow-x-auto overflow-y-auto bg-zinc-50 p-4 text-xs leading-6 text-zinc-800 dark:bg-zinc-900/35 dark:text-zinc-200">
                        <code
                            className="font-mono whitespace-pre"
                            dangerouslySetInnerHTML={{ __html: highlightedCode }}
                        />
                    </pre>
                </div>
            );
        }

        return (
            <p key={index} className="my-1 whitespace-pre-wrap wrap-break-word" dangerouslySetInnerHTML={{ __html: inlineMarkdownToHtml(block.text) }} />
        );
    });
};

const GPTSidebar = ({ open, onClose, messages: externalMessages, onWidthChange }) => {
    const { user } = useUser();
    console.log("user ", user);
    const [messages, setMessages] = useState(externalMessages || []);
    const [loading, setLoading] = useState(false);
    const [copiedIndex, setCopiedIndex] = useState(null);
    const [copiedCodeId, setCopiedCodeId] = useState(null);
    const [width, setWidth] = useState(460);
    const [isResizing, setIsResizing] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [isUserScrolling, setIsUserScrolling] = useState(false);
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);

    // Check if mobile
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 640);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Set a compact default width on desktop to leave plenty of room for PDF viewing.
    useEffect(() => {
        const setInitialWidth = () => {
            if (window.innerWidth < 640) return;
            const clampedWidth = 450;
            setWidth(clampedWidth);
            if (typeof window !== 'undefined') {
                window.__AI_SIDEBAR_WIDTH__ = clampedWidth;
            }
            onWidthChange?.(clampedWidth);
            window.dispatchEvent(new CustomEvent('ai-sidebar-width-change', { detail: { width: clampedWidth } }));
        };

        setInitialWidth();
    }, [onWidthChange]);

    // Auto-scroll intentionally disabled as requested.
    useEffect(() => {
        return undefined;
    }, [messages, loading, isUserScrolling]);

    // Detect if user is manually scrolling
    useEffect(() => {
        const container = messagesContainerRef.current;
        if (!container) return;

        const handleScroll = () => {
            const { scrollTop, scrollHeight, clientHeight } = container;
            const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

            // If user is within 100px of bottom, enable auto-scroll
            // Otherwise, they've scrolled up manually
            setIsUserScrolling(distanceFromBottom > 100);
        };

        container.addEventListener('scroll', handleScroll);
        return () => container.removeEventListener('scroll', handleScroll);
    }, []);

    // Handle resize
    useEffect(() => {
        let animationFrameId = null;

        const handleMouseMove = (e) => {
            if (!isResizing) return;

            // Cancel previous animation frame
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }

            // Use requestAnimationFrame for smooth resizing
            animationFrameId = requestAnimationFrame(() => {
                const newWidth = window.innerWidth - e.clientX;
                if (newWidth >= 420 && newWidth <= 1000) {
                    setWidth(newWidth);
                    onWidthChange?.(newWidth);
                    window.dispatchEvent(new CustomEvent('ai-sidebar-width-change', { detail: { width: newWidth } }));
                }
            });
        };

        const handleMouseUp = () => {
            setIsResizing(false);
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
        };

        if (isResizing) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'ew-resize';
            document.body.style.userSelect = 'none';
            // Prevent text selection during resize
            document.body.style.pointerEvents = 'none';
        } else {
            document.body.style.pointerEvents = '';
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            document.body.style.pointerEvents = '';
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
        };
    }, [isResizing, onWidthChange]);

    if (!open) return null;

    // Send message to backend with typing animation
    const handleSend = async (inputPayload) => {
        const payload = typeof inputPayload === 'string'
            ? { message: inputPayload, attachments: [] }
            : {
                message: inputPayload?.message || '',
                attachments: Array.isArray(inputPayload?.attachments) ? inputPayload.attachments : []
            };

        const trimmedMessage = payload.message.trim();
        const attachmentNames = payload.attachments.map((file) => file?.name).filter(Boolean);

        if (!trimmedMessage && attachmentNames.length === 0) return;

        const userContent = [
            trimmedMessage,
            ...attachmentNames.map((name) => `[Attachment: ${name}]`)
        ].filter(Boolean).join('\n');

        const userMessage = { role: 'user', content: userContent, timestamp: Date.now() };
        setMessages(msgs => [...msgs, userMessage]);
        setLoading(true);

        // ChatGPT-like behavior: when user sends a message, move viewport to latest message.
        requestAnimationFrame(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
        });

        // Don't add placeholder, we'll show loading indicator instead

        try {
            const res = await fetch('/api/gpt-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: trimmedMessage,
                    history: messages.slice(-6),
                    format: 'markdown',
                    attachments: payload.attachments
                })
            });

            const data = await res.json();

            if (data.ok && data.reply) {
                // Stop loading immediately when response arrives
                setLoading(false);

                // Simulate typing animation
                const fullText = data.reply;
                let currentIndex = 0;

                // Add initial message
                const assistantMsg = {
                    role: 'assistant',
                    content: '',
                    timestamp: Date.now(),
                    isTyping: true
                };
                setMessages(msgs => [...msgs, assistantMsg]);

                // Type character by character - update the last message
                const typeInterval = setInterval(() => {
                    if (currentIndex < fullText.length) {
                        const nextChunk = fullText.slice(0, currentIndex + 14); // Larger chunks for much faster rendering
                        currentIndex += 14;

                        setMessages(msgs => {
                            const newMsgs = [...msgs];
                            newMsgs[newMsgs.length - 1] = {
                                ...newMsgs[newMsgs.length - 1],
                                content: nextChunk,
                                isTyping: true
                            };
                            return newMsgs;
                        });
                    } else {
                        clearInterval(typeInterval);
                        setMessages(msgs => {
                            const newMsgs = [...msgs];
                            newMsgs[newMsgs.length - 1] = {
                                ...newMsgs[newMsgs.length - 1],
                                isTyping: false
                            };
                            return newMsgs;
                        });
                    }
                }, 2); // Fast typing interval
            } else {
                setMessages(msgs => [...msgs, {
                    role: 'assistant',
                    content: 'Error: ' + (data.error || 'Unknown error occurred'),
                    timestamp: Date.now(),
                    isError: true
                }]);
                setLoading(false);
            }
        } catch (e) {
            setMessages(msgs => [...msgs, {
                role: 'assistant',
                content: 'Network Error: Could not connect to AI service',
                timestamp: Date.now(),
                isError: true
            }]);
            setLoading(false);
        }
    };

    // Clear all messages
    const handleClearChat = () => {
        if (confirm('Clear all chat history?')) {
            setMessages([]);
        }
    };

    // Copy message to clipboard
    const handleCopy = async (content, index) => {
        try {
            await navigator.clipboard.writeText(content);
            setCopiedIndex(index);
            setTimeout(() => setCopiedIndex(null), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const handleCodeCopy = async (code, codeId) => {
        try {
            await navigator.clipboard.writeText(code);
            setCopiedCodeId(codeId);
            setTimeout(() => setCopiedCodeId(null), 1800);
        } catch (err) {
            console.error('Failed to copy code:', err);
        }
    };

    return (
        <>
            <div
                className="fixed right-0 top-0 bottom-0 z-60 flex flex-col border-l border-zinc-300 bg-linear-to-b from-white via-zinc-50 to-zinc-100 shadow-[0_0_40px_rgba(15,23,42,0.12)] transition-none dark:border-zinc-700/80 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-950 dark:shadow-[0_0_60px_rgba(0,0,0,0.45)]"
                style={{
                    width: isMobile ? '100%' : `${width}px`,
                    pointerEvents: isResizing ? 'none' : 'auto'
                }}
            >
                {/* Resize Handle - Wide and Easy to Click */}
                {!isMobile && (
                    <div
                        className="absolute -left-1 top-0 bottom-0 z-70 flex w-3 cursor-ew-resize items-center justify-center bg-transparent hover:bg-cyan-500/10 group"
                        onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsResizing(true);
                        }}
                        style={{
                            background: 'transparent',
                            pointerEvents: 'auto'
                        }}
                    >
                        {/* Visible handle bar */}
                        <div className="relative h-full w-1 bg-zinc-300/90 transition-all duration-200 group-hover:w-1.5 group-hover:bg-cyan-500 dark:bg-zinc-700/50 dark:group-hover:bg-cyan-400">
                            {/* Center indicator */}
                            <div className="absolute left-1/2 top-1/2 h-16 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-zinc-500 shadow-lg transition-all duration-200 group-hover:h-20 group-hover:w-2 group-hover:bg-cyan-600 dark:bg-zinc-600 dark:group-hover:bg-cyan-300" />
                        </div>
                    </div>
                )}

                {/* Header */}
                <div className="sticky top-0 z-10 border-b border-zinc-200 bg-white/95 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/95">
                    <div className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="w-10 h-10  flex items-center justify-center overflow-hidden">
                                    <Image
                                        src="/aiLogo.png"
                                        alt="AI Assistant"
                                        width={40}
                                        height={40}
                                        className="w-full h-full object-cover"
                                    />
                                </div>

                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">AI Assistant</h2>
                                <p className="text-xs text-zinc-600 dark:text-zinc-400">Ask, explain, debug, and copy code quickly</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {messages.length > 0 && (
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={handleClearChat}
                                    className="text-zinc-600 hover:bg-red-100 hover:text-red-600 dark:text-zinc-400 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                                    title="Clear chat"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            )}
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                    window.dispatchEvent(new CustomEvent('close-ai-sidebar'));
                                    onClose?.();
                                }}
                                className="text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Messages Container */}
                <div
                    ref={messagesContainerRef}
                    className="flex-1 space-y-5 overflow-y-auto p-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-zinc-400 dark:scrollbar-thumb-zinc-700"
                >
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center px-6">

                            <h3 className="mb-2 text-xl font-bold text-zinc-900 dark:text-zinc-100">Start a Conversation</h3>
                            <p className="max-w-sm text-sm text-zinc-600 dark:text-zinc-400">
                                Ask me anything! I'm here to help you with your studies, homework, and questions.
                            </p>
                        </div>
                    ) : (
                        <>
                            {messages.map((msg, idx) => (
                                <div
                                    key={idx}
                                    className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-3 duration-300`}
                                >
                                    {msg.role === 'assistant' && (
                                        <div className="shrink-0 mt-1">
                                            <div className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg overflow-hidden">
                                                <Image
                                                    src="/aiLogo.png"
                                                    alt="AI"
                                                    width={33}
                                                    height={33}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div className={`group max-w-[90%] ${msg.role === 'user' ? 'order-first md:max-w-[82%]' : 'md:max-w-[90%]'}`}>
                                        <div className={`rounded-2xl px-4 py-3 shadow-sm ${msg.role === 'user'
                                            ? 'bg-linear-to-br from-cyan-500 to-blue-600 text-white'
                                            : msg.isError
                                                ? 'border border-red-300 bg-red-50 text-red-700 dark:border-red-800/50 dark:bg-red-950/50 dark:text-red-200'
                                                : 'border border-zinc-300/80 bg-white text-zinc-900 backdrop-blur dark:border-zinc-700/80 dark:bg-zinc-800/55 dark:text-zinc-100'
                                            }`}>
                                            <div className={`text-sm leading-relaxed wrap-break-word ${msg.role === 'user' ? 'whitespace-pre-wrap' : ''}`}>
                                                {msg.role === 'user' ? msg.content : renderMarkdown(msg.content, {
                                                    onCopyCode: handleCodeCopy,
                                                    copiedCodeId,
                                                    onResetCodeCopy: () => setCopiedCodeId(null)
                                                })}
                                            </div>
                                        </div>

                                        {/* Action buttons */}
                                        {!msg.isTyping && (
                                            <div className="flex items-center gap-2 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleCopy(msg.content, idx)}
                                                    className="flex items-center gap-1 rounded px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-500 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-300"
                                                    title="Copy message"
                                                >
                                                    {copiedIndex === idx ? (
                                                        <>
                                                            <Check className="w-3 h-3" />
                                                            <span>Copied!</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Copy className="w-3 h-3" />
                                                            <span>Copy</span>
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {msg.role === 'user' && (
                                        <div className="shrink-0 mt-1">
                                            {user?.imageUrl ? (
                                                <div className="w-8 h-8 rounded-full overflow-hidden shadow-lg ring-2 ring-emerald-500/50">
                                                    <Image
                                                        src={user.imageUrl}
                                                        alt={user.firstName || 'User'}
                                                        width={32}
                                                        height={32}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-linear-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                                                    <User className="w-5 h-5 text-white" />
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}

                            {loading && (
                                <div className="flex gap-3 animate-in fade-in slide-in-from-bottom-3 duration-300">
                                    <div className="shrink-0 mt-1">
                                        <div className="w-8 h-8 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg overflow-hidden">
                                            <Image
                                                src="/aiLogo.png"
                                                alt="AI"
                                                width={32}
                                                height={32}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    </div>
                                    <div className="rounded-2xl border border-zinc-300 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800">
                                        <div className="flex gap-1.5">
                                            <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-500 dark:bg-zinc-400" style={{ animationDelay: '0ms' }}></span>
                                            <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-500 dark:bg-zinc-400" style={{ animationDelay: '150ms' }}></span>
                                            <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-500 dark:bg-zinc-400" style={{ animationDelay: '300ms' }}></span>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </>
                    )}
                </div>

                {/* Input Area */}
                <div className="border-t border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                    <PromptBox
                        onSend={handleSend}
                        disabled={loading}
                    />
                </div>
            </div>
        </>
    );
};

export default GPTSidebar;
