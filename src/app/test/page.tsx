'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@/trpc/client/client';
import { authClient } from '@/lib/auth-client';

export default function TestPage() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();

  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('password123');

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');

  const fieldsQuery = useQuery(trpc.fields.list.queryOptions());

  const createField = useMutation(
    trpc.fields.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.fields.list.queryKey(),
        });
        setName('');
        setDescription('');
        setAddress('');
      },
    }),
  );

  return (
    <div style={{ padding: 24, maxWidth: 480 }}>
      <h1>tRPC Test Page</h1>

      <section style={{ marginBottom: 32 }}>
        <h2>Auth</h2>
        {session ? (
          <div>
            <p>Signed in as {session.user.email}</p>
            <button onClick={() => authClient.signOut()}>Sign out</button>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              authClient.signIn.email({ email, password });
            }}
            style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
          >
            <input
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              placeholder="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button type="submit">Sign in</button>
          </form>
        )}
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2>Create Field</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createField.mutate({
              name,
              description,
              address,
              latitude: 37.98,
              longitude: 23.72,
              indoor: false,
            });
          }}
          style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
        >
          <input
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <input
            placeholder="Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
          <button type="submit" disabled={createField.isPending}>
            {createField.isPending ? 'Creating...' : 'Create Field'}
          </button>
          {createField.isError && (
            <p style={{ color: 'red' }}>{createField.error.message}</p>
          )}
        </form>
      </section>

      <section>
        <h2>Approved Fields</h2>
        {fieldsQuery.isLoading && <p>Loading...</p>}
        {fieldsQuery.isError && (
          <p style={{ color: 'red' }}>{fieldsQuery.error.message}</p>
        )}
        {fieldsQuery.data && fieldsQuery.data.length === 0 && (
          <p>No approved fields yet.</p>
        )}
        <ul>
          {fieldsQuery.data?.map((field) => (
            <li key={field.id}>
              <strong>{field.name}</strong> — {field.address}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
