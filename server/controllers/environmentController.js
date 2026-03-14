import * as environmentRepository from '../repositories/environmentRepository.js';

export const getEnvironments = async (request, reply) => {
  try {
    const environments = await environmentRepository.getAllEnvironments();
    return environments.map(e => ({
      ...e,
      variables: e.variables ? JSON.parse(e.variables) : {}
    }));
  } catch (error) {
    reply.status(500).send({ error: error.message });
  }
};

export const createEnvironment = async (request, reply) => {
  try {
    const { name, variables } = request.body;
    const newEnv = await environmentRepository.createEnvironment(name, variables);
    newEnv.variables = JSON.parse(newEnv.variables);
    reply.status(201).send(newEnv);
  } catch (error) {
    reply.status(500).send({ error: error.message });
  }
};
