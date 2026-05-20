import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCreateReport, ReportInputSeverity } from "@workspace/api-client-react";
import LocationPicker from "@/components/map/LocationPicker";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Droplets, Send, CheckCircle, Leaf, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SEVERITY_COLORS } from "@/lib/constants";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100),
  description: z.string().min(10, "Please describe the leak in more detail").max(500),
  severity: z.enum(["low", "medium", "high", "critical"]),
  ward: z.string().min(2, "Ward / area name is required"),
  reporterName: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const SEVERITY_META = {
  low:      { label: "Low",      desc: "Minor drip",          emoji: "💧" },
  medium:   { label: "Medium",   desc: "Steady flow",          emoji: "🌊" },
  high:     { label: "High",     desc: "Continuous stream",    emoji: "⚠️" },
  critical: { label: "Critical", desc: "Flooding / burst main",emoji: "🚨" },
} as const;

export default function Report() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const createReport = useCreateReport();

  const [step, setStep] = useState(1);
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { title: "", description: "", severity: "medium", ward: "", reporterName: "" },
  });

  const onSubmit = (data: FormValues) => {
    if (!position) {
      toast({ title: "Location required", description: "Please pin the location on the map.", variant: "destructive" });
      return;
    }
    createReport.mutate(
      { data: { ...data, severity: data.severity as ReportInputSeverity, latitude: position[0], longitude: position[1], imageUrl: null } },
      {
        onSuccess: () => setIsSuccess(true),
        onError: () =>
          toast({ title: "Submission failed", description: "Please try again in a moment.", variant: "destructive" }),
      }
    );
  };

  if (isSuccess) {
    return (
      <div className="h-full w-full flex items-center justify-center p-6 bg-slate-950">
        <Card className="w-full max-w-sm bg-slate-900 border-slate-800">
          <CardContent className="p-8 flex flex-col items-center text-center gap-5">
            <div className="w-20 h-20 bg-green-500/15 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(34,197,94,0.2)]">
              <CheckCircle className="w-10 h-10 text-green-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-100 mb-2">Report Submitted!</h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                Thank you for helping Mumbai save water. Your report has been routed to the municipal authority.
              </p>
            </div>
            <div className="w-full bg-cyan-950/40 border border-cyan-900/50 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-cyan-400">
                <Leaf className="w-4 h-4" />
                <span className="text-sm font-medium">Eco Points Earned</span>
              </div>
              <span className="text-2xl font-black text-cyan-300">+10</span>
            </div>
            <div className="flex gap-3 w-full">
              <Button variant="outline" onClick={() => setLocation("/")} className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800">
                View Map
              </Button>
              <Button
                onClick={() => { setIsSuccess(false); setStep(1); form.reset(); setPosition(null); }}
                className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white"
              >
                Report Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-y-auto bg-slate-950">
      <div className="max-w-2xl mx-auto p-6 lg:p-10">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-100 mb-1.5">Report a Water Leak</h1>
          <p className="text-slate-500 text-sm">Every drop counts. Help identify and fix leaks across the city.</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-3 mb-8">
          {[1, 2].map((s) => (
            <div key={s} className="flex items-center gap-3 flex-1">
              <div className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all flex-shrink-0",
                step === s ? "bg-cyan-600 text-white shadow-[0_0_16px_rgba(6,182,212,0.4)]"
                : step > s ? "bg-green-600 text-white" : "bg-slate-800 text-slate-500"
              )}>
                {step > s ? <CheckCircle className="w-3.5 h-3.5" /> : s}
              </div>
              <div className="text-sm">
                <span className={step === s ? "text-slate-200 font-medium" : "text-slate-600"}>
                  {s === 1 ? "Pin Location" : "Leak Details"}
                </span>
              </div>
              {s < 2 && <div className={cn("flex-1 h-px", step > 1 ? "bg-green-800" : "bg-slate-800")} />}
            </div>
          ))}
        </div>

        <Card className="bg-slate-900 border-slate-800 shadow-2xl">
          <CardHeader className="border-b border-slate-800 px-6 py-5">
            <CardTitle className="text-base font-semibold text-slate-100 flex items-center gap-2.5">
              {step === 1
                ? <><MapPin className="w-4 h-4 text-cyan-400" /> Pin Location on Map</>
                : <><Droplets className="w-4 h-4 text-cyan-400" /> Describe the Leak</>}
            </CardTitle>
            <CardDescription className="text-slate-500 text-sm">
              {step === 1
                ? "Click anywhere on the map to drop a pin exactly where the leak is."
                : "Provide details to help the municipal dispatch team respond quickly."}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {step === 1 ? (
              <div className="space-y-5">
                <LocationPicker position={position} onChange={setPosition} />
                <div className="flex justify-between items-center pt-1">
                  {position ? (
                    <span className="text-sm text-green-400 flex items-center gap-1.5 font-medium">
                      <CheckCircle className="w-4 h-4" />
                      Location pinned ({position[0].toFixed(4)}, {position[1].toFixed(4)})
                    </span>
                  ) : (
                    <span className="text-sm text-slate-500">Tap the map to place your pin</span>
                  )}
                  <Button
                    disabled={!position}
                    onClick={() => setStep(2)}
                    className="bg-cyan-600 hover:bg-cyan-500 text-white px-6"
                  >
                    Next →
                  </Button>
                </div>
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control} name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300 text-sm">Brief Title</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Burst main near Metro Station" {...field}
                            className="bg-slate-950 border-slate-800 text-slate-100 focus:border-cyan-600 rounded-xl h-10" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control} name="ward"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-300 text-sm">Ward / Area</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Andheri West" {...field}
                              className="bg-slate-950 border-slate-800 text-slate-100 focus:border-cyan-600 rounded-xl h-10" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control} name="reporterName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-300 text-sm">Your Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Anonymous" {...field}
                              className="bg-slate-950 border-slate-800 text-slate-100 focus:border-cyan-600 rounded-xl h-10" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control} name="severity"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel className="text-slate-300 text-sm">Severity Level</FormLabel>
                        <FormControl>
                          <div className="grid grid-cols-4 gap-2">
                            {(["low", "medium", "high", "critical"] as const).map((sev) => {
                              const color = SEVERITY_COLORS[sev];
                              const meta = SEVERITY_META[sev];
                              const active = field.value === sev;
                              return (
                                <label
                                  key={sev}
                                  className={cn(
                                    "flex flex-col items-center justify-center p-3.5 rounded-xl border-2 cursor-pointer transition-all text-center",
                                    active ? "bg-slate-800/80" : "bg-slate-950 border-slate-800 hover:border-slate-700"
                                  )}
                                  style={{ borderColor: active ? color : undefined, boxShadow: active ? `0 0 16px ${color}25` : undefined }}
                                >
                                  <input type="radio" value={sev} checked={active} onChange={() => field.onChange(sev)} className="sr-only" />
                                  <span className="text-xl mb-1.5">{meta.emoji}</span>
                                  <span className="text-xs font-bold text-slate-200" style={{ color: active ? color : undefined }}>{meta.label}</span>
                                  <span className="text-[10px] text-slate-600 mt-0.5 leading-tight">{meta.desc}</span>
                                </label>
                              );
                            })}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control} name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300 text-sm">Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe the leak and any nearby landmarks that will help the dispatch team locate it…"
                            className="bg-slate-950 border-slate-800 text-slate-100 focus:border-cyan-600 rounded-xl min-h-[90px] resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription className="text-slate-600 text-xs">
                          Include landmarks, cross-streets, or building names.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-between pt-2 border-t border-slate-800">
                    <Button type="button" variant="ghost" onClick={() => setStep(1)} className="text-slate-400 hover:text-slate-200 gap-1.5">
                      <ArrowLeft className="w-4 h-4" /> Back
                    </Button>
                    <Button type="submit" disabled={createReport.isPending} className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 gap-2">
                      {createReport.isPending ? "Submitting…" : <><Send className="w-4 h-4" /> Submit Report</>}
                    </Button>
                  </div>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>

        {/* Eco points hint */}
        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-600">
          <Leaf className="w-3.5 h-3.5 text-green-600" />
          <span>You'll earn <strong className="text-green-500">+10 Eco Points</strong> for this report</span>
        </div>
      </div>
    </div>
  );
}
