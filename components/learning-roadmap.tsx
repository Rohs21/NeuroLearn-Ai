'use client';

import ReactMarkdown from 'react-markdown';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { BookOpen, ExternalLink, Layers3, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export type RoadmapReference = {
  title: string;
  url: string;
  note: string;
};

export type RoadmapNode = {
  title: string;
  summary: string;
  whyItMatters?: string;
  codeExample?: string;
  resources?: { title: string; url: string }[];
  children?: RoadmapNode[];
};

export type LearningRoadmap = {
  title: string;
  summary: string;
  level: string;
  estimatedTime: string;
  documentMarkdown: string;
  outline: RoadmapNode[];
  nextSteps: string[];
  references: RoadmapReference[];
};

function RoadmapBranch({ node, index }: { node: RoadmapNode; index: number }) {
  const hasChildren = Boolean(node.children?.length);

  return (
    <AccordionItem value={`${index}-${node.title}`} className="border-white/10">
      <AccordionTrigger className="text-left gap-3 py-4 hover:no-underline">
        <div className="flex items-start gap-3 text-left">
          <div className="mt-1 h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
            {String(index + 1).padStart(2, '0')}
          </div>
          <div>
            <p className="font-semibold text-zinc-900 dark:text-white">{node.title}</p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 font-normal mt-1">{node.summary}</p>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="space-y-4 pl-10 pr-2">
          {node.whyItMatters && (
            <div className="rounded-2xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/5 p-4 text-sm text-zinc-600 dark:text-zinc-300">
              {node.whyItMatters}
            </div>
          )}

          {node.codeExample && (
            <div className="rounded-2xl border border-zinc-200 dark:border-white/10 bg-zinc-950 text-zinc-100 overflow-hidden">
              <div className="px-4 py-2 border-b border-white/10 text-[10px] uppercase tracking-[0.2em] text-zinc-400">
                Code Example
              </div>
              <pre className="p-4 text-xs sm:text-sm overflow-x-auto whitespace-pre-wrap leading-relaxed">
                <code>{node.codeExample}</code>
              </pre>
            </div>
          )}

          {node.resources?.length ? (
            <div className="grid gap-2">
              {node.resources.map((resource) => (
                <a
                  key={resource.url}
                  href={resource.url}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-center justify-between gap-3 rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-950 px-4 py-3 text-sm transition-all hover:border-primary/40 hover:shadow-lg"
                >
                  <span className="font-medium text-zinc-700 dark:text-zinc-200">{resource.title}</span>
                  <ExternalLink className="h-4 w-4 text-zinc-400 group-hover:text-primary" />
                </a>
              ))}
            </div>
          ) : null}

          {hasChildren ? (
            <div className="ml-3 border-l border-zinc-200 dark:border-white/10 pl-4">
              <Accordion type="single" collapsible className="w-full">
                {node.children!.map((child, childIndex) => (
                  <RoadmapBranch key={child.title} node={child} index={childIndex} />
                ))}
              </Accordion>
            </div>
          ) : null}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

export function LearningRoadmapView({ roadmap }: { roadmap: LearningRoadmap }) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="relative overflow-hidden rounded-[2rem] border border-zinc-200 dark:border-white/10 bg-white/75 dark:bg-zinc-900/70 backdrop-blur-2xl shadow-xl p-6 sm:p-8">
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-4xl space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                AI Learning Document
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-zinc-100 dark:bg-white/5 px-3 py-1 text-xs font-medium text-zinc-600 dark:text-zinc-300">
                <BookOpen className="h-3.5 w-3.5" />
                {roadmap.level}
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
              {roadmap.title}
            </h1>
            <p className="max-w-3xl text-base sm:text-lg text-zinc-600 dark:text-zinc-300 leading-relaxed">
              {roadmap.summary}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[320px]">
            <Card className="border-zinc-200 dark:border-white/10 bg-white/70 dark:bg-white/5 shadow-none">
              <CardContent className="p-4">
                <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-400">Format</p>
                <p className="mt-2 font-semibold text-zinc-900 dark:text-white">Text roadmap</p>
              </CardContent>
            </Card>
            <Card className="border-zinc-200 dark:border-white/10 bg-white/70 dark:bg-white/5 shadow-none">
              <CardContent className="p-4">
                <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-400">Effort</p>
                <p className="mt-2 font-semibold text-zinc-900 dark:text-white">{roadmap.estimatedTime}</p>
              </CardContent>
            </Card>
            <Card className="border-zinc-200 dark:border-white/10 bg-white/70 dark:bg-white/5 shadow-none">
              <CardContent className="p-4">
                <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-400">Branches</p>
                <p className="mt-2 font-semibold text-zinc-900 dark:text-white">{roadmap.outline.length}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(320px,0.65fr)_minmax(0,1.35fr)]">
        <div className="space-y-6">
          <Card className="border-zinc-200 dark:border-white/10 bg-white/80 dark:bg-zinc-950/70 backdrop-blur-2xl shadow-xl">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Layers3 className="h-4 w-4 text-primary" />
                <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Branch Explorer</h2>
              </div>
              <Accordion type="single" collapsible className="w-full">
                {roadmap.outline.map((node, index) => (
                  <RoadmapBranch key={node.title} node={node} index={index} />
                ))}
              </Accordion>
            </CardContent>
          </Card>

          <Card className="border-zinc-200 dark:border-white/10 bg-white/80 dark:bg-zinc-950/70 backdrop-blur-2xl shadow-xl">
            <CardContent className="p-6 space-y-4">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">References</h2>
              <div className="space-y-3">
                {roadmap.references.map((reference) => (
                  <a
                    key={reference.url}
                    href={reference.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block rounded-2xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/5 p-4 transition-all hover:border-primary/40 hover:shadow-lg"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-zinc-900 dark:text-white">{reference.title}</p>
                        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{reference.note}</p>
                      </div>
                      <ExternalLink className="mt-1 h-4 w-4 text-zinc-400" />
                    </div>
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-zinc-200 dark:border-white/10 bg-white/80 dark:bg-zinc-950/70 backdrop-blur-2xl shadow-xl">
            <CardContent className="p-6 space-y-3">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Next Steps</h2>
              <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-300">
                {roadmap.nextSteps.map((step) => (
                  <li key={step} className="rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/5 px-3 py-2">
                    {step}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        <Card className="border-zinc-200 dark:border-white/10 bg-white/80 dark:bg-zinc-950/70 backdrop-blur-2xl shadow-xl overflow-hidden">
          <CardContent className="p-6 sm:p-8 space-y-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">Document</p>
              <h2 className="mt-2 text-2xl font-bold text-zinc-900 dark:text-white">What to learn and how to learn it</h2>
            </div>

            <article className="prose prose-zinc dark:prose-invert max-w-none prose-headings:scroll-mt-24 prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-p:leading-7 prose-li:marker:text-primary">
              <ReactMarkdown>{roadmap.documentMarkdown}</ReactMarkdown>
            </article>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}