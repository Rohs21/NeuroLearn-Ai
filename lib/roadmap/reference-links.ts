type ReferenceLink = {
  title: string;
  url: string;
  note: string;
};

const makeSearchLink = (query: string) => `https://www.google.com/search?q=${encodeURIComponent(query)}`;

function dedupeReferences(items: ReferenceLink[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.url)) {
      return false;
    }

    seen.add(item.url);
    return true;
  });
}

export function buildReferenceLinks(topic: string): ReferenceLink[] {
  const lowerTopic = topic.toLowerCase();
  const references: ReferenceLink[] = [];

  if (/(react|next|javascript|typescript|frontend|web)/.test(lowerTopic)) {
    references.push(
      { title: 'React Documentation', url: 'https://react.dev/', note: 'Official React learning reference' },
      { title: 'Next.js Documentation', url: 'https://nextjs.org/docs', note: 'App Router and framework reference' },
      { title: 'MDN JavaScript Guide', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide', note: 'Core JavaScript concepts and examples' },
      { title: 'TypeScript Handbook', url: 'https://www.typescriptlang.org/docs/handbook/intro.html', note: 'Type safety and language fundamentals' }
    );
  }

  if (/(python|data science|pandas|numpy|ml|machine learning|ai|deep learning)/.test(lowerTopic)) {
    references.push(
      { title: 'Python Documentation', url: 'https://docs.python.org/3/', note: 'Official Python language reference' },
      { title: 'Pandas User Guide', url: 'https://pandas.pydata.org/docs/user_guide/index.html', note: 'Data manipulation workflows' },
      { title: 'NumPy User Guide', url: 'https://numpy.org/doc/stable/user/index.html', note: 'Array programming and numerical computing' },
      { title: 'scikit-learn User Guide', url: 'https://scikit-learn.org/stable/user_guide.html', note: 'Practical machine learning reference' }
    );
  }

  if (/(node|backend|api|express|server|database|postgres|sql|prisma|mongo)/.test(lowerTopic)) {
    references.push(
      { title: 'Node.js Docs', url: 'https://nodejs.org/en/docs', note: 'Runtime and backend APIs' },
      { title: 'Prisma Documentation', url: 'https://www.prisma.io/docs', note: 'Database access and schema management' },
      { title: 'PostgreSQL Documentation', url: 'https://www.postgresql.org/docs/', note: 'Relational database reference' },
      { title: 'MongoDB Documentation', url: 'https://www.mongodb.com/docs/', note: 'Document database reference' }
    );
  }

  if (/(system design|architecture|distributed|scal|microservice|devops|cloud)/.test(lowerTopic)) {
    references.push(
      { title: 'AWS Well-Architected Framework', url: 'https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html', note: 'Architecture best practices' },
      { title: 'Google Cloud Architecture Center', url: 'https://cloud.google.com/architecture', note: 'Reference architectures and patterns' },
      { title: 'Martin Fowler', url: 'https://martinfowler.com/', note: 'Architecture and distributed systems essays' },
      { title: 'Netflix TechBlog', url: 'https://netflixtechblog.com/', note: 'Real-world system design case studies' }
    );
  }

  references.push(
    {
      title: `Search the web for ${topic}`,
      url: makeSearchLink(`${topic} learning roadmap docs`),
      note: 'Broader web references for this topic',
    },
    {
      title: `Official ${topic} docs search`,
      url: makeSearchLink(`site:docs ${topic}`),
      note: 'Search the most relevant official documentation',
    }
  );

  return dedupeReferences(references).slice(0, 6);
}

export type { ReferenceLink };