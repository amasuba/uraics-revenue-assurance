import { useState, useRef, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Send, Bot, User, Lightbulb, TrendingUp, AlertTriangle, FileSearch } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const suggestedQueries = [
  { icon: TrendingUp, text: "Show me top 5 risks by exposure" },
  { icon: AlertTriangle, text: "Which regions have the highest non-compliance?" },
  { icon: FileSearch, text: "Find taxpayers with WHT issues" },
  { icon: Lightbulb, text: "What's the total revenue at risk?" },
];

const mockResponses: Record<string, string> = {
  "top 5 risks": `Based on current data, the top 5 risks by exposure are:

1. **Risk K - Transfer Pricing Anomaly**: UGX 12.0B (180 cases)
2. **Risk L - Related Party Underpricing**: UGX 8.9B (220 cases)  
3. **Risk A - Presumptive Tax Underpayment**: UGX 8.5B (2,340 cases)
4. **Risk R - Cross-border Transaction**: UGX 7.2B (290 cases)
5. **Risk B - EFRIS Sales Variance**: UGX 6.2B (1,890 cases)

Would you like me to drill down into any specific risk category?`,
  
  "regions": `Regional compliance analysis shows:

| Region | Compliance Rate | Flagged | Exposure |
|--------|----------------|---------|----------|
| Eastern | 86.0% | 2,100 | UGX 7.8B |
| Western | 85.0% | 2,700 | UGX 9.5B |
| Central | 85.0% | 4,200 | UGX 18.0B |
| Kampala | 80.2% | 8,900 | UGX 32.0B |

**Kampala has the lowest compliance rate** at 80.2% with the highest exposure of UGX 32B.`,

  "wht": `Found **1,560 taxpayers** flagged for WHT-related issues:

**Risk C - WHT Non-Remittance**: 
- Total cases: 1,560
- Exposure: UGX 4.8B
- Status: High severity

Key patterns identified:
- 45% are in construction sector
- 78% have outstanding amounts > UGX 50M
- Average delinquency period: 8 months

Shall I generate a detailed list for audit assignment?`,

  "revenue at risk": `**Total Revenue at Risk Summary:**

📊 **Overall Exposure**: UGX 67.3 Billion

Breakdown by severity:
- 🔴 High Risk: UGX 45.2B (67.2%)
- 🟠 Medium Risk: UGX 16.1B (23.9%)
- 🔵 Low Risk: UGX 6.0B (8.9%)

**Key Insights:**
- Transfer pricing issues account for 31% of exposure
- VAT-related risks represent 21% of total
- Top 3 regions account for 88% of exposure

This represents potential additional tax collections if all cases are resolved successfully.`,
};

const TATIS360 = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hello! I'm **TATIS360**, your Tax Audit Intelligence assistant. I can help you analyze risks, find taxpayer information, and provide insights from the URAICS database.\n\nHow can I assist you today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (text?: string) => {
    const messageText = text || input;
    if (!messageText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const lowerText = messageText.toLowerCase();
      let response = "I understand you're asking about " + messageText + ". Let me analyze the data and get back to you with relevant insights.";

      if (lowerText.includes("top 5") || lowerText.includes("top five")) {
        response = mockResponses["top 5 risks"];
      } else if (lowerText.includes("region") || lowerText.includes("compliance")) {
        response = mockResponses["regions"];
      } else if (lowerText.includes("wht") || lowerText.includes("withholding")) {
        response = mockResponses["wht"];
      } else if (lowerText.includes("revenue") || lowerText.includes("risk") || lowerText.includes("exposure")) {
        response = mockResponses["revenue at risk"];
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <DashboardLayout title="TATIS360 - Tax Audit Intelligence">
      <div className="grid gap-6 lg:grid-cols-4 h-[calc(100vh-10rem)]">
        {/* Chat Area */}
        <Card className="lg:col-span-3 flex flex-col">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                <Bot className="h-5 w-5 text-primary-foreground" />
              </div>
              TATIS360 Assistant
              <Badge variant="secondary" className="ml-2">AI Powered</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col p-0">
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex gap-3",
                      message.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    {message.role === "assistant" && (
                      <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                        <Bot className="h-4 w-4 text-primary-foreground" />
                      </div>
                    )}
                    <div
                      className={cn(
                        "max-w-[80%] rounded-lg px-4 py-3",
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground"
                      )}
                    >
                      <div className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap">
                        {message.content}
                      </div>
                      <p className={cn(
                        "text-xs mt-2 opacity-70",
                        message.role === "user" ? "text-right" : ""
                      )}>
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                    {message.role === "user" && (
                      <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                        <User className="h-4 w-4 text-secondary-foreground" />
                      </div>
                    )}
                  </div>
                ))}
                {isTyping && (
                  <div className="flex gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                      <Bot className="h-4 w-4 text-primary-foreground" />
                    </div>
                    <div className="bg-muted rounded-lg px-4 py-3">
                      <div className="flex gap-1">
                        <span className="h-2 w-2 rounded-full bg-foreground/50 animate-bounce" />
                        <span className="h-2 w-2 rounded-full bg-foreground/50 animate-bounce delay-100" />
                        <span className="h-2 w-2 rounded-full bg-foreground/50 animate-bounce delay-200" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
            <div className="p-4 border-t">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex gap-2"
              >
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask TATIS360 about risks, taxpayers, or compliance..."
                  className="flex-1"
                />
                <Button type="submit" disabled={!input.trim() || isTyping}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>

        {/* Suggested Queries */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-accent" />
              Suggested Queries
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            <div className="space-y-2">
              {suggestedQueries.map((query, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="w-full justify-start text-left h-auto py-3 px-3"
                  onClick={() => handleSend(query.text)}
                >
                  <query.icon className="h-4 w-4 mr-2 shrink-0 text-muted-foreground" />
                  <span className="text-sm">{query.text}</span>
                </Button>
              ))}
            </div>

            <div className="mt-6 p-4 bg-muted rounded-lg">
              <h4 className="font-medium text-sm mb-2">Quick Tips</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Ask about specific TINs for detailed profiles</li>
                <li>• Query risk categories (a-s) for analysis</li>
                <li>• Request trends and comparisons</li>
                <li>• Ask for audit recommendations</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default TATIS360;
