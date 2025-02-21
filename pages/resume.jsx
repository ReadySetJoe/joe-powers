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
    <div className="max-w-4xl mx-auto p-4 sm:p-8 bg-gradient-to-br from-blue-50 to-indigo-100 text-gray-800 shadow-xl rounded-lg">
      <header className="mb-6 sm:mb-8 bg-white p-4 sm:p-6 rounded-lg shadow-md">
        <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-indigo-700">
          Joe Powers
        </h1>
        <h2 className="text-xl sm:text-2xl text-gray-600 mb-3 sm:mb-4">
          Senior Software Engineer
        </h2>
        <div className="flex flex-wrap gap-3 sm:gap-4 text-sm sm:text-base">
          {Object.values(content.contact({ iconSize: 16 })).map(
            ({ value, icon, href }) => (
              <a
                key={value}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 sm:gap-2 text-indigo-600 hover:text-indigo-800"
              >
                {icon}
                {value}
              </a>
            )
          )}
        </div>
      </header>

      <section className="mb-6 sm:mb-8 bg-white p-4 sm:p-6 rounded-lg shadow-md">
        <h3 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 flex items-center gap-2 text-indigo-700">
          <User size={20} className="sm:w-6 sm:h-6" />
          Summary
        </h3>
        <p className="text-base sm:text-lg mb-3 sm:mb-4">{content.intro}</p>
        <ul className="list-inside text-sm sm:text-lg space-y-1 sm:space-y-2 ml-4">
          {content.summary.map((item, index) => (
            <li key={index} className="list-inside list-disc">
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-6 sm:mb-8 bg-white p-4 sm:p-6 rounded-lg shadow-md">
        <h3 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 flex items-center gap-2 text-indigo-700">
          <Briefcase size={20} className="sm:w-6 sm:h-6" />
          Experience
        </h3>
        {content.experience.map((exp, index) => (
          <div
            key={index}
            className="mb-4 sm:mb-6 border-l-4 border-indigo-500 pl-3 sm:pl-4"
          >
            <h4 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
              {exp.title} at
              {exp.url ? (
                <a
                  href={exp.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:text-indigo-800 flex items-center"
                >
                  {exp.company}
                  <ExternalLink size={12} className="ml-1" />
                </a>
              ) : (
                exp.company
              )}
            </h4>
            <p className="text-base sm:text-lg font-medium text-indigo-600">
              {exp.dates}
            </p>
            <ul className="list-inside mt-2 text-sm sm:text-base">
              {exp.responsibilities.map((res, index) => (
                <li key={index} className="list-inside list-disc">
                  {res}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs sm:text-sm italic">
              Tech stack: {exp.techStack}
            </p>
          </div>
        ))}
      </section>

      <section className="mb-6 sm:mb-8 bg-white p-4 sm:p-6 rounded-lg shadow-md">
        <h3 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 flex items-center gap-2 text-indigo-700">
          <Code size={20} className="sm:w-6 sm:h-6" />
          Skills
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {content.skills.map((skill, index) => (
            <div key={index} className="bg-indigo-100 p-3 sm:p-4 rounded-lg">
              <h4 className="font-semibold text-indigo-700 mb-2 text-base sm:text-lg">
                {skill.label}
              </h4>
              <ul className="list-inside text-sm sm:text-base">
                {skill.values.map((value, index) => (
                  <li key={index} className="list-inside list-disc">
                    {value}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-6 sm:mb-8 bg-white p-4 sm:p-6 rounded-lg shadow-md">
        <h3 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 flex items-center gap-2 text-indigo-700">
          <GraduationCap size={20} className="sm:w-6 sm:h-6" />
          Education
        </h3>
        {content.education.map((edu, index) => (
          <div
            key={index}
            className="mb-3 sm:mb-4 border-l-4 border-indigo-500 pl-3 sm:pl-4"
          >
            <h4 className="text-base sm:text-lg font-semibold">{edu.degree}</h4>
            <p className="text-sm sm:text-base">
              {edu.institution} | {edu.dates}
            </p>
          </div>
        ))}
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
        <section className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
          <h3 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 flex items-center gap-2 text-indigo-700">
            <Code size={20} className="sm:w-6 sm:h-6" />
            Personal Projects
          </h3>
          <p className="mb-3 sm:mb-4 text-sm sm:text-base">
            Find more projects on{" "}
            <a
              href="https://joepowers.dev"
              className="text-indigo-600 hover:text-indigo-800"
            >
              joepowers.dev
            </a>
          </p>
          <ul className="list-inside space-y-2 text-sm sm:text-base">
            {content.projects.map((project, index) => (
              <li key={index} className="list-inside list-disc">
                <a
                  href={project.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:text-indigo-800"
                >
                  {project.name}
                </a>
                : {project.description}
              </li>
            ))}
          </ul>
        </section>

        <section className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
          <h3 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 flex items-center gap-2 text-indigo-700">
            <User size={20} className="sm:w-6 sm:h-6" />
            Interests
          </h3>
          <ul className="list-inside space-y-2 text-sm sm:text-base">
            {content.interests.map((interest, index) => (
              <li key={index} className="list-inside list-disc">
                {interest.value}{" "}
                {interest.url && (
                  <a
                    href={interest.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:text-indigo-800"
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
