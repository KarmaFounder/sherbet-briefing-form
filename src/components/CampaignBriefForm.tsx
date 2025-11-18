import { useMemo } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Popover, PopoverTrigger, PopoverContent } from "./ui/popover";
import { Calendar } from "./ui/calendar";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { Alert } from "./ui/alert";
import { cn } from "../lib/utils";

const INTERNAL_USERS = [
  {
    name: "Inge",
    email: "inge@example.com",
    phone: "+27 000 0000",
  },
  {
    name: "Raff",
    email: "raff@example.com",
    phone: "+27 000 0001",
  },
  {
    name: "Lara",
    email: "lara@example.com",
    phone: "+27 000 0002",
  },
  {
    name: "Nalize",
    email: "nalize@example.com",
    phone: "+27 000 0003",
  },
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

const TV_CHECKBOX_OPTIONS = [
  "script",
  "production",
  "storyboard",
  "location",
  "concept",
  "pitch",
  "talent",
  "media_buying",
  "research",
] as const;

const influencerCheckboxOptions = [
  "Influencer research and suggestions",
  "Influencer rates",
  "Influencer reports",
  "Influencer case studies",
  "Influencer management",
] as const;

const isoDateString = z
  .string()
  .min(1, "Required")
  .refine((value) => {
    if (!value) return false;
    try {
      // parseISO will throw for invalid
      parseISO(value);
      return true;
    } catch {
      return false;
    }
  }, "Invalid date");

const briefSchema = z
  .object({
    user_name: z.string().min(1, "Required"),
    client_name: z.string().min(1, "Required"),
    brand_name: z.string().min(1, "Required"),
    campaign_name: z.string().min(1, "Required"),
    requested_by: z.string().min(1, "Required"),
    job_bag_email: z.string().email("Invalid email"),

    start_date: isoDateString,
    end_date: isoDateString,

    campaign_summary: z.string().min(1, "Required"),

    priority: z.enum(["High", "Medium", "Low"]),

    budget: z
      .string()
      .min(1, "Required")
      .refine((val) => !!val.trim(), "Required"),

    categories: z
      .array(z.string())
      .min(1, "Select at least one category"),

    tv_requirements: z.object({
      enabled: z.boolean().default(false),
      script: z.boolean().default(false),
      production: z.boolean().default(false),
      storyboard: z.boolean().default(false),
      location: z.boolean().default(false),
      concept: z.boolean().default(false),
      pitch: z.boolean().default(false),
      talent: z.boolean().default(false),
      media_buying: z.boolean().default(false),
      research: z.boolean().default(false),
      details: z.string().optional(),
    }),

    social_requirements: z.string().optional(),

    influencer_requirements: z.object({
      enabled: z.boolean().default(false),
      options: z.array(z.string()).optional(),
      details: z.string().optional(),
    }),

    generic_category_requirements: z
      .record(z.string(), z.string())
      .optional(),

    other_requirements: z.string().optional(),

    has_assets: z.boolean(),
    asset_link: z.string().optional(),

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
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["end_date"],
        message: "End date must be on or after start date",
      });
    }

    const kickstart = parseISO(values.kickstart_date);
    const firstReview = parseISO(values.first_review_date);
    const signoff = parseISO(values.sign_off_date);

    if (!isAfter(firstReview, kickstart) &&
        firstReview.getTime() !== kickstart.getTime()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["first_review_date"],
        message: "First review must be on or after kickstart",
      });
    }

    if (!isAfter(signoff, firstReview) &&
        signoff.getTime() !== firstReview.getTime()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["sign_off_date"],
        message: "Sign-off must be on or after first review",
      });
    }

    if (values.has_assets && !values.asset_link) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["asset_link"],
        message: "Asset link is required when assets are provided",
      });
    }

    // Section C: every visible category-specific section should have details
    const selected = new Set(values.categories);

    if (selected.has("TV") && !values.tv_requirements.details?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["tv_requirements", "details"],
        message: "Tell us more about your TV requirements",
      });
    }

    if (selected.has("Social Media") && !values.social_requirements?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["social_requirements"],
        message: "Tell us more about your Social Media requirements",
      });
    }

    if (selected.has("Influencer") &&
        !values.influencer_requirements.details?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["influencer_requirements", "details"],
        message: "Tell us more about your Influencer requirements",
      });
    }

    const genericCategories = CATEGORY_OPTIONS.filter((c) =>
      ["TV", "Social Media", "Influencer"].indexOf(c) === -1,
    );

    for (const cat of genericCategories) {
      if (selected.has(cat)) {
        const key = cat;
        const map = (values.generic_category_requirements ?? {}) as Record<
          string,
          string
        >;
        if (!map[key]?.trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["generic_category_requirements", key],
            message: `Tell us more about your ${cat} requirements`,
          });
        }
      }
    }
  });

export type BriefFormValues = z.infer<typeof briefSchema>;

const DEFAULT_VALUES: BriefFormValues = {
  user_name: "",
  client_name: "",
  brand_name: "",
  campaign_name: "",
  requested_by: "",
  job_bag_email: "",
  start_date: new Date().toISOString().slice(0, 10),
  end_date: new Date().toISOString().slice(0, 10),
  campaign_summary: "",
  priority: "Medium",
  budget: "",
  categories: [],
  tv_requirements: {
    enabled: false,
    script: false,
    production: false,
    storyboard: false,
    location: false,
    concept: false,
    pitch: false,
    talent: false,
    media_buying: false,
    research: false,
    details: "",
  },
  social_requirements: "",
  influencer_requirements: {
    enabled: false,
    options: [],
    details: "",
  },
  generic_category_requirements: {},
  other_requirements: "",
  has_assets: false,
  asset_link: "",
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

export function CampaignBriefForm() {
  const submitBrief = useMutation(api.briefs.submitBrief);

  const form = useForm<BriefFormValues>({
    // Cast is to sidestep resolver generic incompatibility between
    // zod v4 and @hookform/resolvers types.
    resolver: zodResolver(briefSchema) as any,
    defaultValues: DEFAULT_VALUES,
    mode: "onBlur",
  });

  const watchCategories = form.watch("categories");
  const hasTv = watchCategories.includes("TV");
  const hasSocial = watchCategories.includes("Social Media");
  const hasInfluencer = watchCategories.includes("Influencer");

  const genericSelectedCategories = useMemo(
    () =>
      CATEGORY_OPTIONS.filter((cat) =>
        watchCategories.includes(cat),
      ).filter((cat) => !["TV", "Social Media", "Influencer"].includes(cat)),
    [watchCategories],
  );

  const onSubmit = async (values: BriefFormValues) => {
    try {
      const userMeta = INTERNAL_USERS.find((u) => u.name === values.user_name);

      const tvReq = hasTv
        ? {
            script: values.tv_requirements.script,
            production: values.tv_requirements.production,
            storyboard: values.tv_requirements.storyboard,
            location: values.tv_requirements.location,
            concept: values.tv_requirements.concept,
            pitch: values.tv_requirements.pitch,
            talent: values.tv_requirements.talent,
            media_buying: values.tv_requirements.media_buying,
            research: values.tv_requirements.research,
            details: values.tv_requirements.details ?? "",
          }
        : undefined;

      const genericText = genericSelectedCategories
        .map((cat) => {
          const map = values.generic_category_requirements ?? {};
          const details = map[cat] ?? "";
          return `${cat}: ${details}`;
        })
        .join("\n\n");

      await submitBrief({
        user_name: values.user_name,
        user_email: userMeta?.email,
        user_phone: userMeta?.phone,
        client_name: values.client_name,
        brand_name: values.brand_name,
        campaign_name: values.campaign_name,
        requested_by: values.requested_by,
        job_bag_email: values.job_bag_email,
        start_date: values.start_date,
        end_date: values.end_date,
        priority: values.priority,
        budget: Number(values.budget.replace(/[^0-9.]/g, "")) || 0,
        categories: values.categories,
        tv_requirements: tvReq,
        social_requirements: hasSocial ? values.social_requirements ?? "" : undefined,
        generic_category_requirements: genericText || undefined,
        has_assets: values.has_assets,
        asset_link: values.has_assets ? values.asset_link || undefined : undefined,
        references: values.references,
        kickstart_date: values.kickstart_date,
        first_review_date: values.first_review_date,
        sign_off_date: values.sign_off_date,
        billing_type: values.billing_type,
      });

      toast.success("Brief submitted");
      form.reset(DEFAULT_VALUES);
    } catch (error) {
      console.error(error);
      toast.error("Failed to submit brief");
    }
  };

  const billingType = form.watch("billing_type");
  const hasAssets = form.watch("has_assets");

  return (
    <Form {...form}>
      <form
        className="space-y-8"
        onSubmit={form.handleSubmit(onSubmit)}
        noValidate
      >
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
                  <Select
                    onValueChange={(value) => field.onChange(value)}
                    value={field.value}
                  >
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
                  <Input placeholder="Campaign name" {...field} />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="requested_by"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Requested by</FormLabel>
                  <Input
                    placeholder="Client contact (e.g. Debbie Wells)"
                    {...field}
                  />
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
                  <Input
                    type="email"
                    placeholder="name@client.com"
                    {...field}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Start & End dates */}
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
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !field.value && "text-muted-foreground",
                        )}
                      >
                        {field.value
                          ? format(fromIsoToDate(field.value) ?? new Date(), "PPP")
                          : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={fromIsoToDate(field.value)}
                        onSelect={(date) => field.onChange(toIso(date))}
                      />
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
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !field.value && "text-muted-foreground",
                        )}
                      >
                        {field.value
                          ? format(fromIsoToDate(field.value) ?? new Date(), "PPP")
                          : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={fromIsoToDate(field.value)}
                        onSelect={(date) => field.onChange(toIso(date))}
                      />
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
                  <Select
                    value={field.value}
                    onValueChange={(value) => field.onChange(value)}
                  >
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
                  <FormLabel>Budget</FormLabel>
                  <Input
                    placeholder="e.g. R250 000"
                    {...field}
                    onChange={(e) => field.onChange(e.target.value)}
                  />
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
                <Textarea
                  placeholder="High-level overview of what this campaign involves"
                  rows={4}
                  {...field}
                />
                <FormMessage />
              </FormItem>
            )}
          />
        </section>

        {/* Section B */}
        <section className="space-y-4 rounded-lg border bg-card p-4 shadow-sm">
          <h2 className="text-base font-semibold">
            Section B – Category Requirement
          </h2>
          <FormField
            control={form.control}
            name="categories"
            render={() => (
              <FormItem>
                <FormLabel>This campaign requires</FormLabel>
                <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                  {CATEGORY_OPTIONS.map((category) => (
                    <Label
                      key={category}
                      className="flex cursor-pointer items-center gap-2 text-sm font-normal"
                    >
                      <Checkbox
                        checked={watchCategories.includes(category)}
                        onCheckedChange={(checked) => {
                          const current = new Set(watchCategories);
                          if (checked) current.add(category);
                          else current.delete(category);
                          form.setValue("categories", Array.from(current), {
                            shouldValidate: true,
                          });
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

        {/* Section C – dynamic per category */}
        {watchCategories.length > 0 && (
          <section className="space-y-4 rounded-lg border bg-card p-4 shadow-sm">
            <h2 className="text-base font-semibold">
              Section C – Brief per category selected
            </h2>

            {/* TV */}
            {hasTv && (
              <div className="space-y-3 rounded-md border border-dashed p-3">
                <h3 className="text-sm font-semibold">TV Requirements</h3>
                <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                  {TV_CHECKBOX_OPTIONS.map((key) => (
                    <Label
                      key={key}
                      className="flex cursor-pointer items-center gap-2 text-sm font-normal"
                    >
                      <Checkbox
                        checked={Boolean(
                          (form.watch("tv_requirements") as any)?.[key],
                        )}
                        onCheckedChange={(checked) => {
                          const current = {
                            ...(form.getValues("tv_requirements") as any),
                          };
                          current[key] = Boolean(checked);
                          form.setValue("tv_requirements", current as any);
                        }}
                      />
                      <span className="capitalize">
                        {key.replace("_", " ")}
                      </span>
                    </Label>
                  ))}
                </div>

                <FormField
                  control={form.control}
                  name="tv_requirements.details"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Tell us more about your TV requirements
                      </FormLabel>
                      <Textarea rows={3} {...field} />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Influencer */}
            {hasInfluencer && (
              <div className="space-y-3 rounded-md border border-dashed p-3">
                <h3 className="text-sm font-semibold">Influencer Requirements</h3>
                <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                  {influencerCheckboxOptions.map((opt) => (
                    <Label
                      key={opt}
                      className="flex cursor-pointer items-center gap-2 text-sm font-normal"
                    >
                      <Checkbox
                        checked={form
                          .watch("influencer_requirements.options")
                          ?.includes(opt)}
                        onCheckedChange={(checked) => {
                          const current = new Set(
                            form.watch("influencer_requirements.options") || [],
                          );
                          if (checked) current.add(opt);
                          else current.delete(opt);
                          form.setValue(
                            "influencer_requirements.options",
                            Array.from(current),
                          );
                        }}
                      />
                      <span>{opt}</span>
                    </Label>
                  ))}
                </div>

                <FormField
                  control={form.control}
                  name="influencer_requirements.details"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Tell us more about your Influencer requirements
                      </FormLabel>
                      <Textarea rows={3} {...field} />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Social Media */}
            {hasSocial && (
              <div className="space-y-3 rounded-md border border-dashed p-3">
                <h3 className="text-sm font-semibold">Social Media Requirements</h3>
                <FormField
                  control={form.control}
                  name="social_requirements"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Tell us more about your Social Media requirements
                      </FormLabel>
                      <Textarea rows={3} {...field} />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Generic categories */}
            {genericSelectedCategories.map((category) => (
              <div
                key={category}
                className="space-y-3 rounded-md border border-dashed p-3"
              >
                <h3 className="text-sm font-semibold">{category} Requirements</h3>
                <FormField
                  control={form.control}
                  name={
                    `generic_category_requirements.${category}` as any
                  }
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Tell us more about your {category} requirements
                      </FormLabel>
                      <Textarea rows={3} {...field} />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            ))}
          </section>
        )}

        {/* Section D – Additional information and timeline */}
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
                        <Checkbox
                          checked={field.value === true}
                          onCheckedChange={() => field.onChange(true)}
                        />
                        <span>Yes</span>
                      </Label>
                      <Label className="flex cursor-pointer items-center gap-2 text-sm font-normal">
                        <Checkbox
                          checked={field.value === false}
                          onCheckedChange={() => field.onChange(false)}
                        />
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
                      <Input
                        type="url"
                        placeholder="https://drive.google.com/..."
                        {...field}
                      />
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
                    <Textarea
                      placeholder="Paste links for review (e.g., Pinterest, TikTok, etc.)"
                      rows={3}
                      {...field}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Timeline */}
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
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !field.value && "text-muted-foreground",
                            )}
                          >
                            {field.value
                              ? format(
                                  fromIsoToDate(field.value) ?? new Date(),
                                  "PPP",
                                )
                              : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={fromIsoToDate(field.value)}
                            onSelect={(date) => field.onChange(toIso(date))}
                          />
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
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !field.value && "text-muted-foreground",
                            )}
                          >
                            {field.value
                              ? format(
                                  fromIsoToDate(field.value) ?? new Date(),
                                  "PPP",
                                )
                              : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={fromIsoToDate(field.value)}
                            onSelect={(date) => field.onChange(toIso(date))}
                          />
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
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !field.value && "text-muted-foreground",
                            )}
                          >
                            {field.value
                              ? format(
                                  fromIsoToDate(field.value) ?? new Date(),
                                  "PPP",
                                )
                              : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={fromIsoToDate(field.value)}
                            onSelect={(date) => field.onChange(toIso(date))}
                          />
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
                          <Checkbox
                            checked={field.value === "Retainer"}
                            onCheckedChange={() => field.onChange("Retainer")}
                          />
                          <span>Retainer</span>
                        </Label>
                        <Label className="flex cursor-pointer items-center gap-2 text-sm font-normal">
                          <Checkbox
                            checked={field.value === "OutOfScope"}
                            onCheckedChange={() => field.onChange("OutOfScope")}
                          />
                          <span>Out Of Scope</span>
                        </Label>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {billingType === "OutOfScope" && (
                  <Alert variant="warning" className="mt-2">
                    Management will be notified via email.
                  </Alert>
                )}
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
