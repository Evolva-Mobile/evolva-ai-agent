import { GoogleGenAI } from '@google/genai';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GamificationService {
    private agent: GoogleGenAI;
    private readonly logger = new Logger(GamificationService.name);

    constructor(private configService: ConfigService) {
        const apiKey = this.configService.get<string>('GEMINI_API_KEY');

        if (!apiKey) {
            this.logger.error('GEMINI_API_KEY is not set in environment variables');
            throw new Error('GEMINI_API_KEY is required');
        }

        this.agent = new GoogleGenAI({
            apiKey: apiKey,
        })
    }

    async generateMissions(userContext: string) {
        const missionSchema = {
            type: 'OBJECT',
            properties: {
                normalMissions: {
                    type: 'ARRAY',
                    description: 'Lista de pelo menos 5 missões simples e diretas.',
                    items: {
                        type: 'OBJECT',
                        properties: {
                            title: { type: 'STRING', description: 'Título curto da missão' },
                            description: { type: 'STRING', description: 'O que deve ser feito' },
                            xpReward: { type: 'INTEGER', description: 'XP ganho (entre 10 e 50)' },
                            icon: { type: 'STRING', description: 'Um emoji representativo' },
                        },
                        required: ['title', 'description', 'xpReward', 'icon'],
                    },
                },
                bossMission: {
                    type: 'OBJECT',
                    description: 'Uma missão complexa e épica que requer etapas.',
                    properties: {
                        title: { type: 'STRING', description: 'Título épico da missão Boss' },
                        description: { type: 'STRING', description: 'Descrição geral do desafio' },
                        totalXpReward: { type: 'INTEGER', description: 'XP total alto (ex: 500)' },
                        stages: {
                            type: 'ARRAY',
                            description: 'Etapas sequenciais para completar o Boss',
                            items: {
                                type: 'OBJECT',
                                properties: {
                                    stepOrder: { type: 'INTEGER' },
                                    description: { type: 'STRING', description: 'Ação específica desta etapa' },
                                },
                            },
                        },
                    },
                    required: ['title', 'description', 'totalXpReward', 'stages'],
                },
            },
            required: ['normalMissions', 'bossMission'],
        };

        const systemInstruction = `
      Você é um Mestre de RPG (Game Master) especializado em gamificar a vida real.
      Seu objetivo é criar missões engajadoras baseadas no contexto fornecido pelo usuário.
      
      Regras:
      1. Crie SEMPRE pelo menos 5 missões normais (tarefas rápidas, individuais).
      2. Crie SEMPRE 1 missão "Boss" (tarefa complexa, colaborativa, dividida em etapas/stages).
      3. Use linguagem divertida e motivadora, adequada ao contexto.
      4. O contexto do usuário será: "${userContext}".
      5. Responda APENAS com o JSON estruturado conforme solicitado.
    `;

        try {
            const response = await this.agent.models.generateContent({
                model: 'gemini-2.5-flash',
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: missionSchema,
                    systemInstruction: systemInstruction,
                    temperature: 1.2,
                },
                contents: [
                    {
                        role: 'user',
                        parts: [{ text: `Gere as missões para este contexto: ${userContext}` }],
                    },
                ],
            });

            const rawText = response.candidates?.[0]?.content?.parts?.[0]?.text ?? null;

            if (!rawText) throw new Error('Falha ao gerar missões: resposta inválida ou incompleta');

            return JSON.parse(rawText);

        } catch (error) {
            this.logger.error('Erro ao gerar missões com Gemini', error);
            throw error;
        }
    }
}