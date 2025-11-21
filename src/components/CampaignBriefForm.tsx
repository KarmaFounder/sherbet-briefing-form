import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, isAfter, parseISO } from "date-fns";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import { useMutation } from "convex/react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Checkbox } from "./ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Popover, PopoverTrigger, PopoverContent } from "./ui/popover";
import { Calendar } from "./ui/calendar";
import { Form, FormField, FormItem, FormLabel, FormMessage } from "./ui/form";
import { Alert } from "./ui/alert";
import { cn } from "../lib/utils";
import * as FormOptions from "../lib/formOptions";

const INTERNAL_USERS = [
  { name: "Raffaele Mc Creadie", email: "raffaele@sherbetagency.com", phone: "+27 82 771 5667" },
  { name: "Lara Mc Creadie", email: "lara@sherbetagency.com", phone: "+27 82 502 4188" },
  { name: "Inge Liebenberg", email: "inge@sherbetagency.com", phone: "+27 76 955 3358" },
  { name: "Danielle Piek", email: "danielle@sherbetagency.com", phone: "+27 82 441 6209" },
  { name: "Danica Ravic", email: "danica@sherbetagency.com", phone: "+27 81 425 3112" },
  { name: "Petronella Mphahlele", email: "petronella@sherbetagency.com", phone: "+27 60 662 5637" },
  { name: "Silindile Dlamini", email: "silindile@sherbetagency.com", phone: "+27 67 104 6487" },
  { name: "Sammie Lee Rice", email: "sammie@sherbetagency.com", phone: "+27 64 656 0903" },
  { name: "Emma Ghirlada", email: "emma@sherbetagency.com", phone: "+27 74 429 1961" },
  { name: "Christine Chivers", email: "christine@sherbetagency.com", phone: "+27 74 429 1961" },
  { name: "Ayushie Atchannah", email: "ayushie@sherbetagency.com", phone: "+27 72 680 0500" },
  { name: "Nakai Williams", email: "nakai@sherbetagency.com", phone: "+27 66 373 5300" },
  { name: "Elton Matanda", email: "elton@sherbetagency.com", phone: "+27 72 362 7229" },
  { name: "Lesedi Gwebu", email: "lesedi@sherbetagency.com", phone: "+27 76 341 6894" },
  { name: "Caryn Ravic", email: "caryn@sherbetagency.com", phone: "+27 72 057 4793" },
] as const;

const CATEGORY_OPTIONS = [
  "Strategy",
  "Brand development",
  "TV",
  "Radio",
  "Billboard",
  "Print",
  "Brand Video",
  "Photography",
  "PR",
  "Influencer",
  "Activation",
  "Digital",
  "Application Build",
  "Website",
  "Social Media",
  "Other",
] as const;

const isoDateString = z.string().min(1, "Required");

const briefSchema = z
  .object({
    user_name: z.string().min(1, "Required"),
    client_name: z.string().min(1, "Required"),
    brand_name: z.string().min(1, "Required"),
    campaign_name: z.string().min(1, "Required"),
    campaign_summary: z.string().min(1, "Required"),
    requested_by: z.string().min(1, "Required"),
    job_bag_email: z.string().email("Invalid email"),
    start_date: isoDateString,
    end_date: isoDateString,
    priority: z.enum(["High", "Medium", "Low"]),
    budget: z.string().optional(),
    categories: z.array(z.string()).min(1, "Select at least one category"),

    strategy_options: z.array(z.string()).optional(),
    strategy_details: z.string().optional(),
    brand_dev_options: z.array(z.string()).optional(),
    brand_dev_details: z.string().optional(),
    tv_durations: z.array(z.string()).optional(),
    tv_deliverables: z.array(z.string()).optional(),
    tv_details: z.string().optional(),
    radio_durations: z.array(z.string()).optional(),
    radio_deliverables: z.array(z.string()).optional(),
    radio_details: z.string().optional(),
    billboard_sizes: z.array(z.string()).optional(),
    billboard_deliverables: z.array(z.string()).optional(),
    billboard_details: z.string().optional(),
    print_sizes: z.array(z.string()).optional(),
    print_deliverables: z.array(z.string()).optional(),
    print_details: z.string().optional(),
    brand_video_durations: z.array(z.string()).optional(),
    brand_video_deliverables: z.array(z.string()).optional(),
    brand_video_details: z.string().optional(),
    photography_types: z.array(z.string()).optional(),
    photography_deliverables: z.array(z.string()).optional(),
    photography_details: z.string().optional(),
    pr_options: z.array(z.string()).optional(),
    pr_details: z.string().optional(),
    influencer_options: z.array(z.string()).optional(),
    influencer_details: z.string().optional(),
    activation_options: z.array(z.string()).optional(),
    activation_details: z.string().optional(),
    digital_options: z.array(z.string()).optional(),
    digital_sizes: z.array(z.string()).optional(),
    digital_details: z.string().optional(),
    app_build_options: z.array(z.string()).optional(),
    app_build_details: z.string().optional(),
    website_options: z.array(z.string()).optional(),
    website_details: z.string().optional(),
    other_options: z.array(z.string()).optional(),
    other_details: z.string().optional(),

    social_media_items: z
      .array(
        z.object({
          platform: z.string(),
          format: z.string(),
          size: z.string(),
          quantity: z.number().min(1),
        }),
      )
      .optional(),

    has_assets: z.boolean(),
    asset_link: z.string().optional(),
    other_requirements: z.string().optional(),
    references: z.string().min(1, "Required"),
    kickstart_date: isoDateString,
    first_review_date: isoDateString,
    sign_off_date: isoDateString,
    billing_type: z.enum(["Retainer", "OutOfScope"]),
  })
  .superRefine((values, ctx) => {
    const start = parseISO(values.start_date);
    const end = parseISO(values.end_date);
    if (!isAfter(end, start) && end.getTime() !== start.getTime()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["end_date"], message: "End must be on/after start" });
    }
    const kickstart = parseISO(values.kickstart_date);
    const firstReview = parseISO(values.first_review_date);
    const signoff = parseISO(values.sign_off_date);

    // Kickstart cannot be after first review
    if (isAfter(kickstart, firstReview)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["kickstart_date"], message: "Kickstart cannot be after first review" });
    }

    // First review cannot be after deadline
    if (isAfter(firstReview, signoff)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["first_review_date"], message: "First review cannot be after deadline for sign-off" });
    }

    if (values.has_assets && !values.asset_link) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["asset_link"], message: "Asset link required" });
    }
  });

type BriefFormValues = z.infer<typeof briefSchema>;

const DEFAULT_VALUES: BriefFormValues = {
  user_name: "",
  client_name: "",
  brand_name: "",
  campaign_name: "",
  campaign_summary: "",
  requested_by: "",
  job_bag_email: "",
  start_date: new Date().toISOString().slice(0, 10),
  end_date: new Date().toISOString().slice(0, 10),
  priority: "Medium",
  budget: "",
  categories: [],
  strategy_options: [],
  strategy_details: "",
  brand_dev_options: [],
  brand_dev_details: "",
  tv_durations: [],
  tv_deliverables: [],
  tv_details: "",
  radio_durations: [],
  radio_deliverables: [],
  radio_details: "",
  billboard_sizes: [],
  billboard_deliverables: [],
  billboard_details: "",
  print_sizes: [],
  print_deliverables: [],
  print_details: "",
  brand_video_durations: [],
  brand_video_deliverables: [],
  brand_video_details: "",
  photography_types: [],
  photography_deliverables: [],
  photography_details: "",
  pr_options: [],
  pr_details: "",
  influencer_options: [],
  influencer_details: "",
  activation_options: [],
  activation_details: "",
  digital_options: [],
  digital_sizes: [],
  digital_details: "",
  app_build_options: [],
  app_build_details: "",
  website_options: [],
  website_details: "",
  other_options: [],
  other_details: "",
  social_media_items: [],
  has_assets: false,
  asset_link: "",
  other_requirements: "",
  references: "",
  kickstart_date: new Date().toISOString().slice(0, 10),
  first_review_date: new Date().toISOString().slice(0, 10),
  sign_off_date: new Date().toISOString().slice(0, 10),
  billing_type: "Retainer",
};

function toIso(date: Date | undefined): string {
  if (!date) return "";
  return date.toISOString();
}
function fromIsoToDate(value: string | undefined): Date | undefined {
  if (!value) return undefined;
  try {
    return parseISO(value);
  } catch {
    return undefined;
  }
}

export function CampaignBriefForm({ demoTrigger, onSubmitted }: { demoTrigger?: number; onSubmitted?: () => void }) {
  const submitBrief = useMutation(api.briefs.submitBrief);
  const form = useForm<BriefFormValues>({
    resolver: zodResolver(briefSchema) as any,
    defaultValues: DEFAULT_VALUES,
    mode: "onBlur",
  });

  const watchCategories = form.watch("categories");
  const watchUserName = form.watch("user_name");
  const selectedUser = INTERNAL_USERS.find((u) => u.name === watchUserName);

  const [socialRows, setSocialRows] = useState<
    Array<{ platform: string; format: string; size: string; quantity: number; descriptions: string[] }>
  >([]);

  const fillDemoData = () => {
    const demoData: BriefFormValues = {
      user_name: "Nakai Williams",
      client_name: "Coca-Cola",
      brand_name: "Coca-Cola Zero",
      campaign_name: "Summer 2025 Launch Campaign",
      campaign_summary: "Launch campaign for Coca-Cola Zero targeting Gen Z with focus on sustainability and active lifestyle messaging across digital and social platforms.",
      requested_by: "Sarah Johnson",
      job_bag_email: "sarah.johnson@coca-cola.com",
      start_date: "2025-12-01",
      end_date: "2026-02-28",
      priority: "High",
      budget: "R850,000",
      categories: ["Strategy", "Brand Video", "Social Media", "Digital", "Influencer"],
      strategy_options: ["Campaign strategy", "Content strategy"],
      strategy_details: "Develop integrated campaign strategy that positions Coca-Cola Zero as the beverage of choice for active, health-conscious Gen Z consumers. Content strategy to focus on authentic storytelling across paid, owned and earned channels.",
      brand_video_durations: ["15s", "30s", "60s"],
      brand_video_deliverables: ["Brand film", "Motion graphics", "Cutdowns", "Aspect ratios: 16:9 / 9:16 / 1:1"],
      brand_video_details: "Hero brand film showcasing active lifestyle, with cutdowns for various social platforms. Focus on vibrant summer aesthetics.",
      digital_options: ["Display banners", "HTML5 animations"],
      digital_sizes: ["300x250", "728x90", "1080x1920 (mobile)"],
      digital_details: "Animated display banners for programmatic campaign across Google Display Network.",
      influencer_options: ["Influencer strategy", "Talent sourcing", "Campaign management"],
      influencer_details: "Partner with 5 micro-influencers (50k-100k followers) focused on fitness and wellness.",
      has_assets: true,
      asset_link: "https://drive.google.com/drive/folders/example123",
      other_requirements: "All deliverables must adhere to Coca-Cola brand guidelines v2024. Final assets needed 2 weeks before launch.",
      references: "https://www.coca-cola.com/brand-guidelines\nhttps://pinterest.com/summer-campaign-inspo",
      kickstart_date: "2025-11-01",
      first_review_date: "2025-11-15",
      sign_off_date: "2025-11-25",
      billing_type: "Retainer",
    };
    
    // Set form values
    Object.keys(demoData).forEach((key) => {
      form.setValue(key as any, demoData[key as keyof BriefFormValues] as any);
    });
    
    // Set demo social media rows
    setSocialRows([
      { 
        platform: "Instagram", 
        format: "Reels", 
        size: "1080 × 1920", 
        quantity: 3,
        descriptions: [
          "Hero reel: Product reveal with dynamic transitions and upbeat music",
          "Lifestyle reel: Young adults enjoying summer activities with product",
          "Behind-the-scenes reel: Making of the campaign"
        ]
      },
      { 
        platform: "Instagram", 
        format: "Static Posts", 
        size: "1080 × 1080 (Square)", 
        quantity: 2,
        descriptions: [
          "Product shot: Clean minimal aesthetic with summer colors",
          "Quote graphic: Motivational messaging aligned with active lifestyle"
        ]
      },
      { 
        platform: "TikTok", 
        format: "Videos", 
        size: "1080 × 1920", 
        quantity: 2,
        descriptions: [
          "Trend-jacking video: Tie into popular TikTok challenge",
          "Educational content: Benefits of zero sugar vs regular"
        ]
      },
    ]);
    
    toast.success("Demo data loaded!");
  };

  const onSubmit = async (values: BriefFormValues) => {
    try {
      const userMeta = INTERNAL_USERS.find((u) => u.name === values.user_name);
      
      // Submit brief (no PDF generation/download)
      await submitBrief({
        user_name: values.user_name,
        user_email: userMeta?.email,
        user_phone: userMeta?.phone,
        client_name: values.client_name,
        brand_name: values.brand_name,
        campaign_name: values.campaign_name,
        campaign_summary: values.campaign_summary,
        requested_by: values.requested_by,
        job_bag_email: values.job_bag_email,
        start_date: values.start_date,
        end_date: values.end_date,
        priority: values.priority,
        budget: values.budget ? Number(values.budget.replace(/[^0-9.]/g, "")) || undefined : undefined,
        categories: values.categories,
        strategy_options: values.strategy_options,
        strategy_details: values.strategy_details,
        brand_dev_options: values.brand_dev_options,
        brand_dev_details: values.brand_dev_details,
        tv_durations: values.tv_durations,
        tv_deliverables: values.tv_deliverables,
        tv_details: values.tv_details,
        radio_durations: values.radio_durations,
        radio_deliverables: values.radio_deliverables,
        radio_details: values.radio_details,
        billboard_sizes: values.billboard_sizes,
        billboard_deliverables: values.billboard_deliverables,
        billboard_details: values.billboard_details,
        print_sizes: values.print_sizes,
        print_deliverables: values.print_deliverables,
        print_details: values.print_details,
        brand_video_durations: values.brand_video_durations,
        brand_video_deliverables: values.brand_video_deliverables,
        brand_video_details: values.brand_video_details,
        photography_types: values.photography_types,
        photography_deliverables: values.photography_deliverables,
        photography_details: values.photography_details,
        pr_options: values.pr_options,
        pr_details: values.pr_details,
        influencer_options: values.influencer_options,
        influencer_details: values.influencer_details,
        activation_options: values.activation_options,
        activation_details: values.activation_details,
        digital_options: values.digital_options,
        digital_sizes: values.digital_sizes,
        digital_details: values.digital_details,
        app_build_options: values.app_build_options,
        app_build_details: values.app_build_details,
        website_options: values.website_options,
        website_details: values.website_details,
        other_options: values.other_options,
        other_details: values.other_details,
        social_media_items: socialRows.length > 0 ? socialRows : undefined,
        has_assets: values.has_assets,
        asset_link: values.has_assets ? values.asset_link : undefined,
        other_requirements: values.other_requirements,
        references: values.references,
        kickstart_date: values.kickstart_date,
        first_review_date: values.first_review_date,
        sign_off_date: values.sign_off_date,
        billing_type: values.billing_type,
      });
      
      toast.success("Brief submitted!");
      form.reset(DEFAULT_VALUES);
      setSocialRows([]);
      onSubmitted?.();
    } catch (error) {
      console.error(error);
      toast.error("Failed to submit brief");
    }
  };

  const billingType = form.watch("billing_type");
  const hasAssets = form.watch("has_assets");

  // Trigger demo data when demo button clicked
  useEffect(() => {
    if (demoTrigger && demoTrigger > 0) {
      fillDemoData();
    }
  }, [demoTrigger]);

  // Helper to render checkbox array fields
  const renderCheckboxArray = (
    fieldName: keyof BriefFormValues,
    options: readonly string[],
    cols = 2
  ) => {
    const gridClass = cols === 3 ? "grid grid-cols-3 gap-2" : "grid grid-cols-2 gap-2";
    return (
      <FormField
        control={form.control}
        name={fieldName}
        render={({ field }) => (
          <FormItem>
            <div className={gridClass}>
              {options.map((opt) => (
                <Label key={opt} className="flex cursor-pointer items-center gap-2 text-sm font-normal">
                  <Checkbox
                    checked={(field.value as string[] | undefined)?.includes(opt)}
                    onCheckedChange={(checked) => {
                      const current = new Set((field.value as string[]) || []);
                      if (checked) current.add(opt);
                      else current.delete(opt);
                      form.setValue(fieldName, Array.from(current) as any);
                    }}
                  />
                  <span>{opt}</span>
                </Label>
              ))}
            </div>
          </FormItem>
        )}
      />
    );
  };

  // Cascading social media dropdown helpers
  const getAvailableFormats = (platform: string) => {
    return FormOptions.SOCIAL_MEDIA_FORMATS[platform] || [];
  };

  const getAvailableSizes = (platform: string, format: string) => {
    const platformSizes = FormOptions.SOCIAL_MEDIA_SIZES[platform];
    if (!platformSizes) return [];
    return platformSizes[format] || [];
  };

  return (
    <Form {...form}>
      <form className="space-y-8" onSubmit={form.handleSubmit(onSubmit)} noValidate>
        {/* Section A */}
        <section className="space-y-4 rounded-lg border bg-card p-4 shadow-sm">
          <h2 className="text-base font-semibold">Section A – Overview</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="user_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your name</FormLabel>
                  <Select onValueChange={(value) => field.onChange(value)} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your name" />
                    </SelectTrigger>
                    <SelectContent>
                      {INTERNAL_USERS.map((user) => (
                        <SelectItem key={user.name} value={user.name}>
                          {user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {selectedUser && (
              <>
                <div className="space-y-1">
                  <Label className="text-sm">Email</Label>
                  <Input value={selectedUser.email} readOnly className="bg-muted" />
                </div>
                <div className="space-y-1">
                  <Label className="text-sm">Phone</Label>
                  <Input value={selectedUser.phone} readOnly className="bg-muted" />
                </div>
              </>
            )}
            <FormField
              control={form.control}
              name="client_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client</FormLabel>
                  <Input placeholder="Client name" {...field} />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="brand_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Brand</FormLabel>
                  <Input placeholder="Brand name" {...field} />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="campaign_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Campaign Name</FormLabel>
                  <Input placeholder="must be same name as the job bag" {...field} />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="requested_by"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Requested by Client</FormLabel>
                  <Input placeholder="Client contact name" {...field} />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="job_bag_email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Bag Update Email</FormLabel>
                  <Input type="email" placeholder="email addresses JB provided by mail" {...field} />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="start_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Campaign Start</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}
                      >
                        {field.value ? format(fromIsoToDate(field.value) ?? new Date(), "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={fromIsoToDate(field.value)} onSelect={(date) => field.onChange(toIso(date))} />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="end_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Campaign End</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}
                      >
                        {field.value ? format(fromIsoToDate(field.value) ?? new Date(), "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={fromIsoToDate(field.value)} onSelect={(date) => field.onChange(toIso(date))} />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                  <Select value={field.value} onValueChange={(value) => field.onChange(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="budget"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Budget (if known)</FormLabel>
                  <Input placeholder="e.g. R250 000 (optional)" {...field} onChange={(e) => field.onChange(e.target.value)} />
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="campaign_summary"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Campaign Summary</FormLabel>
                <Textarea placeholder="High-level overview" rows={4} {...field} />
                <FormMessage />
              </FormItem>
            )}
          />
        </section>

        {/* Section B */}
        <section className="space-y-4 rounded-lg border bg-card p-4 shadow-sm">
          <h2 className="text-base font-semibold">Section B – Category Requirement</h2>
          <FormField
            control={form.control}
            name="categories"
            render={() => (
              <FormItem>
                <FormLabel>This campaign requires</FormLabel>
                <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                  {CATEGORY_OPTIONS.map((category) => (
                    <Label key={category} className="flex cursor-pointer items-center gap-2 text-sm font-normal">
                      <Checkbox
                        checked={watchCategories.includes(category)}
                        onCheckedChange={(checked) => {
                          const current = new Set(watchCategories);
                          if (checked) current.add(category);
                          else current.delete(category);
                          form.setValue("categories", Array.from(current), { shouldValidate: true });
                        }}
                      />
                      <span>{category}</span>
                    </Label>
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </section>

        {/* Section C */}
        {watchCategories.length > 0 && (
          <section className="space-y-4 rounded-lg border bg-card p-4 shadow-sm">
            <h2 className="text-base font-semibold">Section C – Brief per category selected</h2>

            {watchCategories.includes("Strategy") && (
              <div className="space-y-3 rounded-md border border-dashed p-3">
                <h3 className="text-sm font-semibold">Strategy Options</h3>
                {renderCheckboxArray("strategy_options", FormOptions.STRATEGY_OPTIONS, 2)}
                <FormField
                  control={form.control}
                  name="strategy_details"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tell us more about your Strategy requirements</FormLabel>
                      <Textarea rows={3} {...field} />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {watchCategories.includes("Brand development") && (
              <div className="space-y-3 rounded-md border border-dashed p-3">
                <h3 className="text-sm font-semibold">Brand Development Options</h3>
                {renderCheckboxArray("brand_dev_options", FormOptions.BRAND_DEV_OPTIONS, 2)}
                <FormField
                  control={form.control}
                  name="brand_dev_details"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tell us more about your Brand Development requirements</FormLabel>
                      <Textarea rows={3} {...field} />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {watchCategories.includes("TV") && (
              <div className="space-y-3 rounded-md border border-dashed p-3">
                <h3 className="text-sm font-semibold">TV Requirements</h3>
                <div>
                  <Label>Durations</Label>
                  {renderCheckboxArray("tv_durations", FormOptions.TV_DURATIONS, 3)}
                </div>
                <div>
                  <Label>Deliverables</Label>
                  {renderCheckboxArray("tv_deliverables", FormOptions.TV_DELIVERABLES, 2)}
                </div>
                <FormField
                  control={form.control}
                  name="tv_details"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tell us more about your TV requirements</FormLabel>
                      <Textarea rows={3} {...field} />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {watchCategories.includes("Radio") && (
              <div className="space-y-3 rounded-md border border-dashed p-3">
                <h3 className="text-sm font-semibold">Radio Requirements</h3>
                <div>
                  <Label>Durations</Label>
                  {renderCheckboxArray("radio_durations", FormOptions.RADIO_DURATIONS, 3)}
                </div>
                <div>
                  <Label>Deliverables</Label>
                  {renderCheckboxArray("radio_deliverables", FormOptions.RADIO_DELIVERABLES, 2)}
                </div>
                <FormField
                  control={form.control}
                  name="radio_details"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tell us more about your Radio requirements</FormLabel>
                      <Textarea rows={3} {...field} />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {watchCategories.includes("Billboard") && (
              <div className="space-y-3 rounded-md border border-dashed p-3">
                <h3 className="text-sm font-semibold">Billboard Requirements</h3>
                <div>
                  <Label>Sizes</Label>
                  {renderCheckboxArray("billboard_sizes", FormOptions.BILLBOARD_SIZES, 2)}
                </div>
                <div>
                  <Label>Deliverables</Label>
                  {renderCheckboxArray("billboard_deliverables", FormOptions.BILLBOARD_DELIVERABLES, 2)}
                </div>
                <FormField
                  control={form.control}
                  name="billboard_details"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tell us more about your Billboard requirements</FormLabel>
                      <Textarea rows={3} {...field} />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {watchCategories.includes("Print") && (
              <div className="space-y-3 rounded-md border border-dashed p-3">
                <h3 className="text-sm font-semibold">Print Requirements</h3>
                <div>
                  <Label>Sizes</Label>
                  {renderCheckboxArray("print_sizes", FormOptions.PRINT_SIZES, 2)}
                </div>
                <div>
                  <Label>Deliverables</Label>
                  {renderCheckboxArray("print_deliverables", FormOptions.PRINT_DELIVERABLES, 2)}
                </div>
                <FormField
                  control={form.control}
                  name="print_details"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tell us more about your Print requirements</FormLabel>
                      <Textarea rows={3} {...field} />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {watchCategories.includes("Brand Video") && (
              <div className="space-y-3 rounded-md border border-dashed p-3">
                <h3 className="text-sm font-semibold">Brand Video Requirements</h3>
                <div>
                  <Label>Durations</Label>
                  {renderCheckboxArray("brand_video_durations", FormOptions.BRAND_VIDEO_DURATIONS, 3)}
                </div>
                <div>
                  <Label>Deliverables</Label>
                  {renderCheckboxArray("brand_video_deliverables", FormOptions.BRAND_VIDEO_DELIVERABLES, 2)}
                </div>
                <FormField
                  control={form.control}
                  name="brand_video_details"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tell us more about your Brand Video requirements</FormLabel>
                      <Textarea rows={3} {...field} />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {watchCategories.includes("Photography") && (
              <div className="space-y-3 rounded-md border border-dashed p-3">
                <h3 className="text-sm font-semibold">Photography Requirements</h3>
                <div>
                  <Label>Types</Label>
                  {renderCheckboxArray("photography_types", FormOptions.PHOTOGRAPHY_TYPES, 2)}
                </div>
                <div>
                  <Label>Deliverables</Label>
                  {renderCheckboxArray("photography_deliverables", FormOptions.PHOTOGRAPHY_DELIVERABLES, 2)}
                </div>
                <FormField
                  control={form.control}
                  name="photography_details"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tell us more about your Photography requirements</FormLabel>
                      <Textarea rows={3} {...field} />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {watchCategories.includes("PR") && (
              <div className="space-y-3 rounded-md border border-dashed p-3">
                <h3 className="text-sm font-semibold">PR Options</h3>
                {renderCheckboxArray("pr_options", FormOptions.PR_OPTIONS, 2)}
                <FormField
                  control={form.control}
                  name="pr_details"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tell us more about your PR requirements</FormLabel>
                      <Textarea rows={3} {...field} />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {watchCategories.includes("Influencer") && (
              <div className="space-y-3 rounded-md border border-dashed p-3">
                <h3 className="text-sm font-semibold">Influencer Options</h3>
                {renderCheckboxArray("influencer_options", FormOptions.INFLUENCER_OPTIONS, 2)}
                <FormField
                  control={form.control}
                  name="influencer_details"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tell us more about your Influencer requirements</FormLabel>
                      <Textarea rows={3} {...field} />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {watchCategories.includes("Activation") && (
              <div className="space-y-3 rounded-md border border-dashed p-3">
                <h3 className="text-sm font-semibold">Activation Options</h3>
                {renderCheckboxArray("activation_options", FormOptions.ACTIVATION_OPTIONS, 2)}
                <FormField
                  control={form.control}
                  name="activation_details"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tell us more about your Activation requirements</FormLabel>
                      <Textarea rows={3} {...field} />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {watchCategories.includes("Digital") && (
              <div className="space-y-3 rounded-md border border-dashed p-3">
                <h3 className="text-sm font-semibold">Digital Requirements</h3>
                <div>
                  <Label>Options</Label>
                  {renderCheckboxArray("digital_options", FormOptions.DIGITAL_OPTIONS, 2)}
                </div>
                <div>
                  <Label>Banner Sizes</Label>
                  {renderCheckboxArray("digital_sizes", FormOptions.DIGITAL_BANNER_SIZES, 2)}
                </div>
                <FormField
                  control={form.control}
                  name="digital_details"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tell us more about your Digital requirements</FormLabel>
                      <Textarea rows={3} {...field} />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {watchCategories.includes("Application Build") && (
              <div className="space-y-3 rounded-md border border-dashed p-3">
                <h3 className="text-sm font-semibold">Application Build Options</h3>
                {renderCheckboxArray("app_build_options", FormOptions.APP_BUILD_OPTIONS, 2)}
                <FormField
                  control={form.control}
                  name="app_build_details"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tell us more about your Application Build requirements</FormLabel>
                      <Textarea rows={3} {...field} />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {watchCategories.includes("Website") && (
              <div className="space-y-3 rounded-md border border-dashed p-3">
                <h3 className="text-sm font-semibold">Website Options</h3>
                {renderCheckboxArray("website_options", FormOptions.WEBSITE_OPTIONS, 2)}
                <FormField
                  control={form.control}
                  name="website_details"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tell us more about your Website requirements</FormLabel>
                      <Textarea rows={3} {...field} />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {watchCategories.includes("Other") && (
              <div className="space-y-3 rounded-md border border-dashed p-3">
                <h3 className="text-sm font-semibold">Other Requirements</h3>
                {renderCheckboxArray("other_options", FormOptions.OTHER_OPTIONS, 2)}
                <FormField
                  control={form.control}
                  name="other_details"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tell us more about your Other requirements</FormLabel>
                      <Textarea rows={3} {...field} />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {watchCategories.includes("Social Media") && (
              <div className="space-y-3 rounded-md border border-dashed p-3">
                <h3 className="text-sm font-semibold">Social Media Items</h3>
                {socialRows.map((row, idx) => {
                  const availableFormats = getAvailableFormats(row.platform);
                  const availableSizes = getAvailableSizes(row.platform, row.format);
                  return (
                    <div key={idx} className="space-y-3 rounded-md border border-gray-200 p-3 bg-gray-50">
                      <div className="grid grid-cols-[2fr,2fr,2fr,auto,auto] gap-2 items-end">
                        <div className="space-y-1">
                          <Label className="text-xs">Platform</Label>
                          <Select
                            value={row.platform}
                            onValueChange={(v) => {
                              const updated = [...socialRows];
                              updated[idx].platform = v;
                              updated[idx].format = "";
                              updated[idx].size = "";
                              setSocialRows(updated);
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {FormOptions.SOCIAL_MEDIA_PLATFORMS.map((p) => (
                                <SelectItem key={p} value={p}>
                                  {p}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Format</Label>
                          <Select
                            value={row.format}
                            onValueChange={(v) => {
                              const updated = [...socialRows];
                              updated[idx].format = v;
                              updated[idx].size = "";
                              setSocialRows(updated);
                            }}
                            disabled={!row.platform}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select format" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableFormats.map((f) => (
                                <SelectItem key={f} value={f}>
                                  {f}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Size</Label>
                          <Select
                            value={row.size}
                            onValueChange={(v) => {
                              const updated = [...socialRows];
                              updated[idx].size = v;
                              setSocialRows(updated);
                            }}
                            disabled={!row.format}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select size" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableSizes.map((s) => (
                                <SelectItem key={s} value={s}>
                                  {s}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Quantity</Label>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-10 w-10 rounded-md"
                              onClick={() => {
                                const newQty = Math.max(1, row.quantity - 1);
                                const updated = [...socialRows];
                                updated[idx].quantity = newQty;
                                // Adjust descriptions array
                                const currentDescs = updated[idx].descriptions || [];
                                updated[idx].descriptions = currentDescs.slice(0, newQty);
                                setSocialRows(updated);
                              }}
                              disabled={row.quantity <= 1}
                            >
                              <span className="text-lg">−</span>
                            </Button>
                            <div className="flex h-10 w-12 items-center justify-center rounded-md border bg-white text-center font-semibold">
                              {row.quantity}
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-10 w-10 rounded-md"
                              onClick={() => {
                                const newQty = row.quantity + 1;
                                const updated = [...socialRows];
                                updated[idx].quantity = newQty;
                                // Adjust descriptions array
                                const currentDescs = updated[idx].descriptions || [];
                                updated[idx].descriptions = [...currentDescs, ...Array(newQty - currentDescs.length).fill("")];
                                setSocialRows(updated);
                              }}
                            >
                              <span className="text-lg">+</span>
                            </Button>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSocialRows(socialRows.filter((_, i) => i !== idx));
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                      
                      {/* Visual size preview */}
                      {row.size && (() => {
                        const sizeMatch = row.size.match(/(\d+)\s*[x×]\s*(\d+)/);
                        if (!sizeMatch) return null;
                        const width = parseInt(sizeMatch[1]);
                        const height = parseInt(sizeMatch[2]);
                        // Scale to fit in container (max 200px width)
                        const maxWidth = 200;
                        const scale = Math.min(maxWidth / width, 1);
                        const rectWidth = width * scale;
                        const rectHeight = height * scale;
                        
                        return (
                          <div className="mt-3 p-3 bg-white rounded border">
                            <Label className="text-xs text-gray-600 mb-2 block">Size Preview:</Label>
                            <div className="flex items-center gap-3">
                              <div
                                style={{
                                  width: `${rectWidth}px`,
                                  height: `${rectHeight}px`,
                                  minWidth: '20px',
                                  minHeight: '20px'
                                }}
                                className="border-2 border-gray-300 bg-gray-100 flex items-center justify-center rounded"
                              >
                                <span className="text-xs text-gray-500 font-mono">
                                  {width}×{height}
                                </span>
                              </div>
                              <div className="text-xs text-gray-600">
                                <div><strong>Dimensions:</strong> {width} × {height}px</div>
                                <div><strong>Aspect Ratio:</strong> {(width / height).toFixed(2)}:1</div>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                      
                      {/* Individual brief descriptions for each quantity */}
                      {row.quantity > 0 && (
                        <div className="space-y-2 mt-3">
                          <Label className="text-xs font-semibold">Brief for each item:</Label>
                          {Array.from({ length: row.quantity }).map((_, descIdx) => (
                            <div key={descIdx} className="space-y-1">
                              <Label className="text-xs text-gray-600">Item {descIdx + 1} Description</Label>
                              <Textarea
                                rows={2}
                                placeholder={`Brief/description for ${row.platform} ${row.format} item ${descIdx + 1}`}
                                value={row.descriptions[descIdx] || ""}
                                onChange={(e) => {
                                  const updated = [...socialRows];
                                  const descs = [...(updated[idx].descriptions || [])];
                                  descs[descIdx] = e.target.value;
                                  updated[idx].descriptions = descs;
                                  setSocialRows(updated);
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSocialRows([...socialRows, { platform: "Instagram", format: "", size: "", quantity: 1, descriptions: [""] }]);
                  }}
                >
                  Add Social Media Item
                </Button>
              </div>
            )}
          </section>
        )}

        {/* Section D */}
        <section className="space-y-4 rounded-lg border bg-card p-4 shadow-sm">
          <h2 className="text-base font-semibold">Section D – Additional Information</h2>
          <FormField
            control={form.control}
            name="other_requirements"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Any other requirements...</FormLabel>
                <Textarea rows={3} {...field} />
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid gap-4 md:grid-cols-[1.2fr,1fr]">
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="has_assets"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Are there assets from the client?</FormLabel>
                    <div className="flex gap-4">
                      <Label className="flex cursor-pointer items-center gap-2 text-sm font-normal">
                        <Checkbox checked={field.value === true} onCheckedChange={() => field.onChange(true)} />
                        <span>Yes</span>
                      </Label>
                      <Label className="flex cursor-pointer items-center gap-2 text-sm font-normal">
                        <Checkbox checked={field.value === false} onCheckedChange={() => field.onChange(false)} />
                        <span>No</span>
                      </Label>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {hasAssets && (
                <FormField
                  control={form.control}
                  name="asset_link"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Paste Link (Asset Link)</FormLabel>
                      <Input type="url" placeholder="https://drive.google.com/..." {...field} />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <FormField
                control={form.control}
                name="references"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>References we must consider (NB)</FormLabel>
                    <Textarea placeholder="Paste links for review" rows={3} {...field} />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="space-y-3 rounded-md border p-3">
              <h3 className="text-sm font-semibold">Timeline</h3>
              <div className="space-y-3">
                <FormField
                  control={form.control}
                  name="kickstart_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kickstart scheduled for</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}
                          >
                            {field.value ? format(fromIsoToDate(field.value) ?? new Date(), "PPP") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={fromIsoToDate(field.value)} onSelect={(date) => field.onChange(toIso(date))} />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="first_review_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First review</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}
                          >
                            {field.value ? format(fromIsoToDate(field.value) ?? new Date(), "PPP") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={fromIsoToDate(field.value)} onSelect={(date) => field.onChange(toIso(date))} />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="sign_off_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Deadline for sign-off</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}
                          >
                            {field.value ? format(fromIsoToDate(field.value) ?? new Date(), "PPP") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={fromIsoToDate(field.value)} onSelect={(date) => field.onChange(toIso(date))} />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="billing_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>This project is billed under</FormLabel>
                      <div className="flex gap-4">
                        <Label className="flex cursor-pointer items-center gap-2 text-sm font-normal">
                          <Checkbox checked={field.value === "Retainer"} onCheckedChange={() => field.onChange("Retainer")} />
                          <span>Retainer</span>
                        </Label>
                        <Label className="flex cursor-pointer items-center gap-2 text-sm font-normal">
                          <Checkbox checked={field.value === "OutOfScope"} onCheckedChange={() => field.onChange("OutOfScope")} />
                          <span>Out Of Scope</span>
                        </Label>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {billingType === "OutOfScope" && <Alert variant="warning" className="mt-2">Management will be notified via email.</Alert>}
              </div>
            </div>
          </div>
        </section>

        <div className="flex justify-end">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Submitting..." : "Submit Brief"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
