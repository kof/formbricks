"use client";

import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { useEnvironment } from "@/lib/environments/environments";
import { useProduct } from "@/lib/products/products";
import { useProfile } from "@/lib/profile";
import { createSurvey } from "@/lib/surveys/surveys";
import { replacePresetPlaceholders } from "@/lib/templates";
import { cn } from "@formbricks/lib/cn";
import type { Template } from "@formbricks/types/templates";
import { Button, ErrorComponent } from "@formbricks/ui";
import { PlusCircleIcon } from "@heroicons/react/24/outline";
import { SparklesIcon } from "@heroicons/react/24/solid";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { customSurvey, templates } from "./templates";

type TemplateList = {
  environmentId: string;
  onTemplateClick: (template: Template) => void;
};

const ALL_CATEGORY_NAME = "All";
const RECOMMENDED_CATEGORY_NAME = "For you";

export default function TemplateList({ environmentId, onTemplateClick }: TemplateList) {
  const router = useRouter();

  const [activeTemplate, setActiveTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(false);
  const { product, isLoadingProduct, isErrorProduct } = useProduct(environmentId);
  const { profile, isLoadingProfile, isErrorProfile } = useProfile();
  const { environment } = useEnvironment(environmentId);
  const [selectedFilter, setSelectedFilter] = useState(RECOMMENDED_CATEGORY_NAME);

  const [categories, setCategories] = useState<Array<string>>([]);

  /*   useEffect(() => {
    if (product && templates?.length) {
      setActiveTemplate(customSurvey);
    }
  }, [product]); */

  useEffect(() => {
    const defaultCategories = [
      /* ALL_CATEGORY_NAME, */
      ...(Array.from(new Set(templates.map((template) => template.category))) as string[]),
    ];

    const fullCategories =
      !!profile?.objective && profile.objective !== "other"
        ? [RECOMMENDED_CATEGORY_NAME, ...defaultCategories]
        : [ALL_CATEGORY_NAME, ...defaultCategories];

    setCategories(fullCategories);

    const activeFilter =
      !!profile?.objective && profile.objective !== "other" ? RECOMMENDED_CATEGORY_NAME : ALL_CATEGORY_NAME;
    setSelectedFilter(activeFilter);
  }, [profile]);

  const addSurvey = async (activeTemplate) => {
    setLoading(true);
    const augmentedTemplate = {
      ...activeTemplate.preset,
      type: environment?.widgetSetupCompleted ? "web" : "link",
    };
    const survey = await createSurvey(environmentId, augmentedTemplate);
    router.push(`/environments/${environmentId}/surveys/${survey.id}/edit`);
  };

  if (isLoadingProduct || isLoadingProfile) return <LoadingSpinner />;
  if (isErrorProduct || isErrorProfile) return <ErrorComponent />;

  return (
    <main className="relative z-0 flex-1 overflow-y-auto px-6 pb-6 pt-3 focus:outline-none">
      <div className="mb-6 flex flex-wrap space-x-2">
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => setSelectedFilter(category)}
            className={cn(
              selectedFilter === category
                ? " bg-slate-800 font-semibold text-white"
                : " bg-white text-slate-700 hover:bg-slate-100",
              "mt-2 rounded border border-slate-800 px-2 py-1 text-sm transition-all duration-150 "
            )}>
            {category}
            {category === RECOMMENDED_CATEGORY_NAME && <SparklesIcon className="ml-1 inline h-5 w-5" />}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => {
            const newTemplate = replacePresetPlaceholders(customSurvey, product);
            onTemplateClick(newTemplate);
            setActiveTemplate(newTemplate);
          }}
          className={cn(
            activeTemplate?.name === customSurvey.name
              ? "ring-brand border-transparent ring-2"
              : "hover:border-brand-dark  border-dashed border-slate-300",
            "duration-120  group relative rounded-lg border-2  bg-transparent p-8 transition-colors duration-150"
          )}>
          <PlusCircleIcon className="text-brand-dark h-8 w-8 transition-all duration-150 group-hover:scale-110" />
          <h3 className="text-md mb-1 mt-3 text-left font-bold text-slate-700 ">{customSurvey.name}</h3>
          <p className="text-left text-xs text-slate-600 ">{customSurvey.description}</p>
          {activeTemplate?.name === customSurvey.name && (
            <div className="text-left">
              <Button
                variant="darkCTA"
                className="mt-6 px-6 py-3"
                disabled={activeTemplate === null}
                loading={loading}
                onClick={() => addSurvey(activeTemplate)}>
                Create survey
              </Button>
            </div>
          )}
        </button>
        {templates
          .filter(
            (template) =>
              selectedFilter === ALL_CATEGORY_NAME ||
              template.category === selectedFilter ||
              (selectedFilter === RECOMMENDED_CATEGORY_NAME &&
                template.objectives?.includes(profile.objective))
          )
          .map((template: Template) => (
            <div
              onClick={() => {
                const newTemplate = replacePresetPlaceholders(template, product);
                onTemplateClick(newTemplate);
                setActiveTemplate(newTemplate);
              }}
              key={template.name}
              className={cn(
                activeTemplate?.name === template.name && "ring-brand ring-2",
                "duration-120  group  relative cursor-pointer rounded-lg bg-white p-6 shadow transition-all duration-150 hover:scale-105"
              )}>
              <div className="absolute right-6 top-6 rounded border border-slate-300 bg-slate-50 px-1.5 py-0.5 text-xs text-slate-500">
                {template.category}
              </div>
              <template.icon className="h-8 w-8" />
              <h3 className="text-md mb-1 mt-3 text-left font-bold text-slate-700">{template.name}</h3>
              <p className="text-left text-xs text-slate-600">{template.description}</p>
              {activeTemplate?.name === template.name && (
                <Button
                  variant="darkCTA"
                  className="mt-6 px-6 py-3"
                  disabled={activeTemplate === null}
                  loading={loading}
                  onClick={() => addSurvey(activeTemplate)}>
                  Use this template
                </Button>
              )}
            </div>
          ))}
      </div>
    </main>
  );
}
