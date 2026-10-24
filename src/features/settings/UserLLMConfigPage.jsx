import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { openAuthModal } from '../user/userSlice';
import { llmConfigApi } from '../../api/llmConfigApi';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import {
  Sparkles,
  KeyRound,
  Server,
  Save,
  Trash2,
  LogIn,
  ShieldCheck,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

const PROVIDERS = [
  { value: 'openai', label: 'OpenAI', needsBaseUrl: false, defaultModel: 'gpt-4o-mini' },
  { value: 'gemini', label: 'Google Gemini', needsBaseUrl: false, defaultModel: 'gemini-1.5-flash' },
  { value: 'anthropic', label: 'Anthropic Claude', needsBaseUrl: false, defaultModel: 'claude-3-5-sonnet-20241022' },
  { value: 'openrouter', label: 'OpenRouter', needsBaseUrl: true, defaultModel: 'google/gemini-2.0-flash-001' },
  { value: 'custom', label: 'Custom (OpenAI-compatible)', needsBaseUrl: true, defaultModel: '' },
];

const EMPTY_FORM = {
  provider: 'openai',
  api_key: '',
  model: 'gpt-4o-mini',
  base_url: '',
  temperature: 0.7,
  max_tokens: 4096,
};

export function UserLLMConfigPage() {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.user);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [configured, setConfigured] = useState(false);
  const [hasStoredKey, setHasStoredKey] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showKey, setShowKey] = useState(false);
  const [message, setMessage] = useState(null);

  const loadConfig = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await llmConfigApi.getConfig();
      setConfigured(Boolean(res?.configured));
      const cfg = res?.config;
      if (cfg) {
        setHasStoredKey(Boolean(cfg.has_api_key));
        setForm({
          provider: cfg.provider || 'openai',
          api_key: '',
          model: cfg.model || '',
          base_url: cfg.base_url || '',
          temperature: cfg.temperature ?? 0.7,
          max_tokens: cfg.max_tokens ?? 4096,
        });
      } else {
        setHasStoredKey(false);
        setForm(EMPTY_FORM);
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: err?.response?.data?.detail || 'Could not load your LLM configuration.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadConfig();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const handleChange = (field, value) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'provider') {
        const provider = PROVIDERS.find((p) => p.value === value);
        if (provider?.defaultModel) next.model = provider.defaultModel;
        if (!provider?.needsBaseUrl) next.base_url = '';
      }
      return next;
    });
  };

  const selectedProvider = PROVIDERS.find((p) => p.value === form.provider) || PROVIDERS[0];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    if (!form.model.trim()) {
      setMessage({ type: 'error', text: 'Model name is required.' });
      return;
    }
    if (selectedProvider.needsBaseUrl && !form.base_url.trim()) {
      setMessage({ type: 'error', text: 'Base URL is required for this provider.' });
      return;
    }
    if (!hasStoredKey && !form.api_key.trim()) {
      setMessage({ type: 'error', text: 'API key is required the first time you save.' });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        provider: form.provider,
        model: form.model.trim(),
        base_url: form.base_url.trim() || null,
        temperature: Number(form.temperature),
        max_tokens: Number(form.max_tokens),
      };
      if (form.api_key.trim()) payload.api_key = form.api_key.trim();
      const res = await llmConfigApi.saveConfig(payload);
      setConfigured(true);
      setHasStoredKey(Boolean(res?.config?.has_api_key));
      setForm((prev) => ({ ...prev, api_key: '' }));
      setShowKey(false);
      setMessage({ type: 'success', text: 'LLM configuration saved. New requests will use your provider.' });
    } catch (err) {
      setMessage({
        type: 'error',
        text: err?.response?.data?.detail || 'Could not save your LLM configuration.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setMessage(null);
    try {
      await llmConfigApi.deleteConfig();
      setConfigured(false);
      setHasStoredKey(false);
      setForm(EMPTY_FORM);
      setMessage({ type: 'success', text: 'Configuration removed. The platform will use the server default provider.' });
    } catch (err) {
      setMessage({
        type: 'error',
        text: err?.response?.data?.detail || 'Could not remove your configuration.',
      });
    } finally {
      setDeleting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-[720px] w-full mx-auto py-10 px-2 animate-fadeIn">
        <Card className="text-center space-y-4 bg-[#111114] border border-[#292932] text-[#F4F4F5]">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-[#211C38] border border-[#49406F] flex items-center justify-center">
            <KeyRound className="w-6 h-6 text-[#8B7CFF]" />
          </div>
          <h2 className="text-xl font-extrabold tracking-tight">Connect your own LLM</h2>
          <p className="text-sm text-[#A1A1AA] max-w-md mx-auto">
            Sign in to store your provider credentials and use your own API key and model across the platform.
          </p>
          <Button onClick={() => dispatch(openAuthModal())} className="mx-auto">
            <LogIn className="w-4 h-4" />
            Sign in to continue
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-[860px] w-full mx-auto py-4 px-2 space-y-6 animate-fadeIn text-[#F4F4F5]">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#111114] p-6 rounded-2xl border border-[#292932] shadow-subtle">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="ai" size="sm">
              <Sparkles className="w-3.5 h-3.5 text-[#8B7CFF]" />
              Model Preferences
            </Badge>
            {configured ? (
              <Badge variant="primary" size="sm">Using your provider</Badge>
            ) : (
              <Badge variant="default" size="sm">Server default</Badge>
            )}
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight">LLM Configuration</h2>
          <p className="text-xs text-[#A1A1AA] max-w-xl">
            Your saved credentials are used for every AI request you make. When no configuration is saved,
            the platform falls back to the server-wide provider from the environment.
          </p>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-[#71717A] bg-[#16161B] border border-[#292932] rounded-xl px-3 py-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          Keys encrypted at rest
        </div>
      </div>

      {message && (
        <div
          className={`flex items-start gap-2 p-3 rounded-xl border text-xs font-medium ${
            message.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
              : 'bg-rose-950/40 border-rose-900/60 text-rose-300'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <Card className="bg-[#111114] border border-[#292932] text-[#F4F4F5]">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-sm text-[#A1A1AA]">
            <span className="w-5 h-5 border-2 border-[#8B7CFF] border-t-transparent rounded-full animate-spin mr-2" />
            Loading configuration…
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#A1A1AA]">Provider</label>
                <select
                  value={form.provider}
                  onChange={(e) => handleChange('provider', e.target.value)}
                  className="w-full h-10 px-3 bg-[#16161B] border border-[#292932] rounded-xl text-sm text-[#F4F4F5] focus:outline-none focus:border-[#8B7CFF]"
                >
                  {PROVIDERS.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#A1A1AA]">Model</label>
                <input
                  type="text"
                  value={form.model}
                  onChange={(e) => handleChange('model', e.target.value)}
                  placeholder="e.g. gpt-4o-mini"
                  className="w-full h-10 px-3 bg-[#16161B] border border-[#292932] rounded-xl text-sm text-[#F4F4F5] placeholder:text-[#52525B] focus:outline-none focus:border-[#8B7CFF]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#A1A1AA]">
                API Key {hasStoredKey && <span className="text-[#71717A] font-normal">(leave blank to keep the stored key)</span>}
              </label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={form.api_key}
                  onChange={(e) => handleChange('api_key', e.target.value)}
                  placeholder={hasStoredKey ? '••••••••••••••••' : 'sk-...'}
                  autoComplete="off"
                  className="w-full h-10 pl-3 pr-10 bg-[#16161B] border border-[#292932] rounded-xl text-sm text-[#F4F4F5] placeholder:text-[#52525B] focus:outline-none focus:border-[#8B7CFF]"
                />
                <button
                  type="button"
                  onClick={() => setShowKey((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center text-[#71717A] hover:text-[#F4F4F5] rounded-lg"
                  aria-label={showKey ? 'Hide API key' : 'Show API key'}
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-[#71717A] flex items-center gap-1">
                <KeyRound className="w-3 h-3" />
                Stored encrypted in the database and never returned to the browser in plaintext.
              </p>
            </div>

            {selectedProvider.needsBaseUrl && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#A1A1AA]">Base URL</label>
                <input
                  type="url"
                  value={form.base_url}
                  onChange={(e) => handleChange('base_url', e.target.value)}
                  placeholder={
                    form.provider === 'openrouter'
                      ? 'https://openrouter.ai/api/v1'
                      : 'https://your-endpoint/v1'
                  }
                  className="w-full h-10 px-3 bg-[#16161B] border border-[#292932] rounded-xl text-sm text-[#F4F4F5] placeholder:text-[#52525B] focus:outline-none focus:border-[#8B7CFF]"
                />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#A1A1AA]">Temperature</label>
                  <span className="text-xs font-mono text-[#8B7CFF]">{Number(form.temperature).toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.05"
                  value={form.temperature}
                  onChange={(e) => handleChange('temperature', e.target.value)}
                  className="w-full accent-[#8B7CFF]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#A1A1AA]">Max Tokens</label>
                <input
                  type="number"
                  min="1"
                  max="128000"
                  step="1"
                  value={form.max_tokens}
                  onChange={(e) => handleChange('max_tokens', e.target.value)}
                  className="w-full h-10 px-3 bg-[#16161B] border border-[#292932] rounded-xl text-sm text-[#F4F4F5] focus:outline-none focus:border-[#8B7CFF]"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#222229]">
              <div className="text-[11px] text-[#71717A] flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5" />
                Applies to AI chat, diagnostics, questions and curriculum generation.
              </div>
              <div className="flex items-center gap-2">
                {configured && (
                  <Button type="button" variant="danger" size="sm" onClick={handleDelete} disabled={deleting}>
                    <Trash2 className="w-3.5 h-3.5" />
                    {deleting ? 'Removing…' : 'Remove config'}
                  </Button>
                )}
                <Button type="submit" size="sm" disabled={saving}>
                  <Save className="w-3.5 h-3.5" />
                  {saving ? 'Saving…' : 'Save configuration'}
                </Button>
              </div>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}

export default UserLLMConfigPage;
