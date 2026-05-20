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
import { Droplet, MapPin, AlertTriangle, Send, CheckCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SEVERITY_COLORS } from "@/lib/constants";

const formSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100),
  description: z.string().min(10, "Description must be at least 10 characters").max(500),
  severity: z.enum(["low", "medium", "high", "critical"]),
  ward: z.string().min(2, "Ward is required"),
  reporterName: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function Report() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const createReport = useCreateReport();
  
  const [step, setStep] = useState(1);
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      severity: "medium",
      ward: "",
      reporterName: "",
    },
  });

  const onSubmit = (data: FormValues) => {
    if (!position) {
      toast({
        title: "Location required",
        description: "Please select a location on the map.",
        variant: "destructive",
      });
      return;
    }

    createReport.mutate({
      data: {
        ...data,
        severity: data.severity as ReportInputSeverity,
        latitude: position[0],
        longitude: position[1],
        imageUrl: null,
      }
    }, {
      onSuccess: () => {
        setIsSuccess(true);
      },
      onError: () => {
        toast({
          title: "Submission failed",
          description: "There was an error submitting your report. Please try again.",
          variant: "destructive",
        });
      }
    });
  };

  if (isSuccess) {
    return (
      <div className="h-full w-full flex items-center justify-center p-6">
        <Card className="w-full max-w-md bg-slate-900 border-slate-800 text-center py-12">
          <CardContent className="space-y-6">
            <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(34,197,94,0.3)]">
              <CheckCircle className="w-10 h-10" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-100 mb-2">Report Submitted!</h2>
              <p className="text-slate-400">Thank you for helping save water. Your report has been routed to the municipal authority.</p>
            </div>
            <div className="bg-cyan-950/30 border border-cyan-900 rounded-lg p-4 mx-8">
              <p className="text-sm text-cyan-400 font-medium mb-1">Eco Points Earned</p>
              <p className="text-3xl font-bold text-cyan-300">+10</p>
            </div>
            <div className="pt-4 flex gap-4 justify-center">
              <Button variant="outline" onClick={() => setLocation("/")} className="border-slate-700 text-slate-300 hover:bg-slate-800">
                View Map
              </Button>
              <Button onClick={() => { setIsSuccess(false); setStep(1); form.reset(); setPosition(null); }} className="bg-cyan-600 hover:bg-cyan-500 text-white">
                Report Another
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-y-auto p-6 lg:p-10">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-100 mb-2 flex items-center">
            <AlertTriangle className="w-8 h-8 mr-3 text-cyan-500" />
            Report a Water Leak
          </h1>
          <p className="text-slate-400 text-lg">Every drop counts. Help us identify and fix leaks across the city.</p>
        </div>

        <div className="flex gap-2 mb-8">
          <div className={`h-2 flex-1 rounded-full ${step >= 1 ? 'bg-cyan-500' : 'bg-slate-800'}`}></div>
          <div className={`h-2 flex-1 rounded-full ${step >= 2 ? 'bg-cyan-500' : 'bg-slate-800'}`}></div>
        </div>

        <Card className="bg-slate-900 border-slate-800 shadow-xl">
          <CardHeader className="border-b border-slate-800 bg-slate-950/50">
            <CardTitle className="text-slate-100 flex items-center">
              {step === 1 ? <><MapPin className="w-5 h-5 mr-2 text-cyan-500" /> Step 1: Pin Location</> : <><Droplet className="w-5 h-5 mr-2 text-cyan-500" /> Step 2: Leak Details</>}
            </CardTitle>
            <CardDescription className="text-slate-400">
              {step === 1 ? "Click on the map to place a pin exactly where the leak is." : "Provide specific details about the leak to help dispatch teams."}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {step === 1 ? (
              <div className="space-y-6">
                <LocationPicker position={position} onChange={setPosition} />
                <div className="flex justify-between items-center">
                  <div className="text-sm text-slate-400">
                    {position ? (
                      <span className="text-cyan-400 font-medium flex items-center">
                        <CheckCircle className="w-4 h-4 mr-1" /> Location selected
                      </span>
                    ) : "Please select a location"}
                  </div>
                  <Button 
                    disabled={!position} 
                    onClick={() => setStep(2)}
                    className="bg-cyan-600 hover:bg-cyan-500 text-white"
                  >
                    Next Step
                  </Button>
                </div>
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300">Brief Title</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Burst main pipe near Metro Station" {...field} className="bg-slate-950 border-slate-800 text-slate-100 focus:border-cyan-500" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="ward"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-300">Ward / Area Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Andheri West" {...field} className="bg-slate-950 border-slate-800 text-slate-100 focus:border-cyan-500" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="reporterName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-300">Your Name (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Anonymous" {...field} className="bg-slate-950 border-slate-800 text-slate-100 focus:border-cyan-500" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="severity"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel className="text-slate-300">Severity Level</FormLabel>
                        <FormControl>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {(["low", "medium", "high", "critical"] as const).map((sev) => (
                              <label key={sev} className={`
                                flex flex-col items-center justify-center p-4 rounded-lg border-2 cursor-pointer transition-all
                                ${field.value === sev ? 'bg-slate-800' : 'bg-slate-950 border-slate-800 hover:border-slate-700'}
                              `} style={{ borderColor: field.value === sev ? SEVERITY_COLORS[sev] : undefined }}>
                                <input type="radio" value={sev} checked={field.value === sev} onChange={() => field.onChange(sev)} className="sr-only" />
                                <Droplet className="w-6 h-6 mb-2" style={{ color: SEVERITY_COLORS[sev] }} />
                                <span className="font-medium text-slate-200 capitalize">{sev}</span>
                              </label>
                            ))}
                          </div>
                        </FormControl>
                        <FormDescription className="text-slate-500">
                          Low: Minor drip. Medium: Steady flow. High: Continuous stream. Critical: Gushing main pipe / flooding.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300">Detailed Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Provide any landmarks or specific details to help find the leak..." 
                            className="bg-slate-950 border-slate-800 text-slate-100 focus:border-cyan-500 min-h-[100px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-between pt-4 border-t border-slate-800">
                    <Button type="button" variant="outline" onClick={() => setStep(1)} className="border-slate-700 text-slate-300 hover:bg-slate-800">
                      Back
                    </Button>
                    <Button type="submit" disabled={createReport.isPending} className="bg-cyan-600 hover:bg-cyan-500 text-white">
                      {createReport.isPending ? "Submitting..." : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Submit Report
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
