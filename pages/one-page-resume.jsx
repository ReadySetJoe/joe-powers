import {
  Briefcase,
  Code,
  ExternalLink,
  GraduationCap,
  User,
} from "lucide-react";
import React from "react";
import { content } from "../components/resume/content";

const ResumePage = () => {
  return (
    <div className="max-w-[8.5in] mx-auto p-5 bg-white text-gray-800">
      <header className="mb-3">
        <h1 className="text-2xl font-bold mb-1 text-indigo-700">Joe Powers</h1>
        <h2 className="text-lg text-gray-600 mb-1">Senior Software Engineer</h2>
        <div className="flex flex-wrap text-xs gap-x-3 gap-y-1">
          {Object.values(content.contact({ iconSize: 10 })).map(
            ({ value, icon, href }) => (
              <a
                key={value}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-indigo-600"
              >
                {icon}
                {value}
              </a>
            )
          )}
        </div>
      </header>

      <section className="mb-4">
        <h3 className="text-base font-semibold mb-1 flex items-center gap-1 text-indigo-700">
          <User size={14} />
          Summary
        </h3>
        <p className="text-xs mb-1">{content.intro}</p>
        <ul className="list-disc list-inside text-xs space-y-0.5 ml-2">
          {content.summary.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="mb-4">
        <h3 className="text-base font-semibold mb-1 flex items-center gap-1 text-indigo-700">
          <Briefcase size={14} />
          Experience
        </h3>
        {content.experience.map((exp, index) => (
          <div key={index} className="mb-2">
            <h4 className="text-sm font-semibold flex items-center gap-1">
              {exp.title} at
              {exp.url ? (
                <a
                  href={exp.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 flex items-center"
                >
                  {exp.company}
                  <ExternalLink size={8} className="ml-0.5" />
                </a>
              ) : (
                <span className="text-indigo-600">{exp.company}</span>
              )}
            </h4>
            <p className="text-xs font-medium text-indigo-600">{exp.dates}</p>
            <ul className="list-disc list-inside text-xs mt-0.5 space-y-0.5">
              {exp.responsibilities.map((res, index) => (
                <li key={index}>{res}</li>
              ))}
            </ul>
            <p className="text-xs mt-0.5 italic">Tech stack: {exp.techStack}</p>
          </div>
        ))}
      </section>

      <div className="flex gap-4">
        <section className="flex-1">
          <h3 className="text-base font-semibold mb-1 flex items-center gap-1 text-indigo-700">
            <Code size={14} />
            Skills
          </h3>
          <div className="grid grid-cols-2 gap-1 text-xs">
            {content.skills.map((skill, index) => (
              <div key={index}>
                <h4 className="font-semibold text-indigo-700">{skill.label}</h4>
                <p>{skill.values.join(", ")}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="flex-1">
          <h3 className="text-base font-semibold mb-1 flex items-center gap-1 text-indigo-700">
            <GraduationCap size={14} />
            Education
          </h3>
          <div className="text-xs space-y-1">
            {content.education.map((edu, index) => (
              <p key={index}>
                <strong>{edu.degree}</strong> <br />
                {edu.institution}, {edu.dates}
              </p>
            ))}
          </div>
        </section>
      </div>

      <div className="flex gap-4 mt-4">
        <section className="flex-1">
          <h3 className="text-base font-semibold mb-1 flex items-center gap-1 text-indigo-700">
            <Code size={14} />
            Personal Projects
          </h3>
          <ul className="list-disc list-inside text-xs space-y-0.5">
            {content.projects.map((project, index) => (
              <li key={index}>
                <a
                  href={project.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600"
                >
                  {project.name}
                </a>
                : {project.description}
              </li>
            ))}
          </ul>
        </section>

        <section className="flex-1">
          <h3 className="text-base font-semibold mb-1 flex items-center gap-1 text-indigo-700">
            <User size={14} />
            Interests
          </h3>
          <ul className="list-disc list-inside text-xs space-y-0.5">
            {content.interests.map((interest, index) => (
              <li key={index}>
                {interest.value}
                {interest.url && (
                  <a
                    href={interest.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600"
                  >
                    {interest.urlText}
                  </a>
                )}
              </li>
            ))}
          </ul>
        </section>
      </div>

      {content.secret.message}
      {content.secret.style}
    </div>
  );
};

export default ResumePage;
