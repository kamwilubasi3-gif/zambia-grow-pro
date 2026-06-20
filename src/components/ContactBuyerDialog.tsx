import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Mail, MessageSquare, Phone, Copy, Check, Send } from "lucide-react";
import { useAppState } from "@/context/AppContext";
import { toast } from "sonner";

interface Buyer {
  name: string;
  type: string;
  location: string;
  phone: string;
  email: string;
  website: string;
  pricePerKg: string;
  minimumQuantity: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  buyer: Buyer | null;
  crop: string;
  quantity: string;
}

const ContactBuyerDialog = ({ open, onClose, buyer, crop, quantity }: Props) => {
  const { location } = useAppState();
  const [tab, setTab] = useState<"email" | "sms">("email");
  const [copied, setCopied] = useState(false);

  if (!buyer) return null;

  const farmerLoc = location ? `${location.district}, ${location.province}` : "Zambia";
  const qtyLine = quantity ? quantity : "a quantity to be agreed";

  const emailSubject = `Offer to supply ${crop} from ${farmerLoc}`;
  const emailBody = `Dear ${buyer.name},

My name is [Your Name] and I am a farmer based in ${farmerLoc}, Zambia. I currently have ${qtyLine} of ${crop} available for sale and would like to offer it to your company.

Please find a summary of my offer below:
• Crop: ${crop}
• Quantity available: ${qtyLine}
• Quality: Freshly harvested, well sorted and dried
• Location: ${farmerLoc}
• Asking price: open to your current rate (${buyer.pricePerKg})

Kindly let me know:
1. Whether you are buying ${crop} at the moment.
2. Your current price per kg and minimum quantity (your listed minimum is ${buyer.minimumQuantity}).
3. Pickup or delivery arrangements.
4. Payment terms.

You can reach me on this email or on my mobile number [Your Phone]. I look forward to your response and to working with ${buyer.name}.

Kind regards,
[Your Name]
${farmerLoc}`;

  const smsBody = `Hello ${buyer.name}, I am a farmer from ${farmerLoc}. I have ${qtyLine} of ${crop} for sale. Please share your current price and pickup details. Thank you. [Your Name]`;

  const body = tab === "email" ? emailBody : smsBody;

  const copy = async () => {
    const text = tab === "email" ? `Subject: ${emailSubject}\n\n${emailBody}` : smsBody;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 1500);
  };

  const sendNow = () => {
    if (tab === "email") {
      const to = buyer.email && buyer.email !== "Contact via website" ? buyer.email : "";
      const url = `mailto:${to}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
      window.location.href = url;
    } else {
      const phone = buyer.phone && buyer.phone !== "Contact via website" ? buyer.phone.replace(/\s/g, "") : "";
      const url = `sms:${phone}?body=${encodeURIComponent(smsBody)}`;
      window.location.href = url;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Contact {buyer.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="text-xs text-muted-foreground space-y-0.5">
            <p>📍 {buyer.location}</p>
            {buyer.phone && buyer.phone !== "Contact via website" && <p>📞 {buyer.phone}</p>}
            {buyer.email && buyer.email !== "Contact via website" && <p>✉️ {buyer.email}</p>}
          </div>

          <div className="flex gap-2 border-b">
            <button
              onClick={() => setTab("email")}
              className={`px-3 py-2 text-sm font-medium border-b-2 transition ${
                tab === "email" ? "border-primary text-primary" : "border-transparent text-muted-foreground"
              }`}
            >
              <Mail className="w-4 h-4 inline mr-1" /> Email Draft
            </button>
            <button
              onClick={() => setTab("sms")}
              className={`px-3 py-2 text-sm font-medium border-b-2 transition ${
                tab === "sms" ? "border-primary text-primary" : "border-transparent text-muted-foreground"
              }`}
            >
              <MessageSquare className="w-4 h-4 inline mr-1" /> SMS Draft
            </button>
          </div>

          {tab === "email" && (
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Subject</label>
              <p className="text-sm font-medium mt-1 mb-2 p-2 bg-muted rounded">{emailSubject}</p>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-muted-foreground">Message</label>
            <Textarea
              value={body}
              readOnly
              className="mt-1 min-h-[260px] text-sm font-mono"
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              Replace [Your Name] and [Your Phone] before sending.
            </p>
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={copy} className="flex-1">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />} Copy
            </Button>
            <Button onClick={sendNow} className="flex-1">
              <Send className="w-4 h-4" /> {tab === "email" ? "Open Email" : "Open SMS"}
            </Button>
            {buyer.phone && buyer.phone !== "Contact via website" && tab === "sms" && (
              <Button variant="secondary" onClick={() => (window.location.href = `tel:${buyer.phone}`)}>
                <Phone className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ContactBuyerDialog;
